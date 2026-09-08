"use client";

import { useEffect, useMemo, useState } from "react";
import type { ItemDTO, MovementDTO } from "@/lib/types";
import { formatDateTime, formatDays } from "@/lib/format";

export default function HistorialPage() {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ item: ItemDTO; movements: MovementDTO[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/items", { cache: "no-store" })
      .then((r) => r.json())
      .then(setItems);
  }, []);

  useEffect(() => {
    if (!selectedItemId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/items/${selectedItemId}/historial`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setDetail(data);
        setLoadingDetail(false);
      });
  }, [selectedItemId]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    return items.filter((i) => i.code.toLowerCase().includes(q)).slice(0, 20);
  }, [items, search]);

  if (!selectedItemId) {
    return (
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-steel mb-1">
          Selecciona una caja o plataforma
        </label>
        <input
          type="text"
          placeholder="Buscar por numero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm mb-2"
        />
        <div className="flex flex-col gap-1">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItemId(item.id)}
              className="text-left bg-white border border-line rounded-md px-3 py-2 text-sm hover:border-orange"
            >
              <span className="font-bold">{item.code}</span>
              <span className="text-steel"> -- {item.locationName}</span>
            </button>
          ))}
          {filteredItems.length === 0 && <p className="text-sm text-steel">Sin resultados.</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setSelectedItemId(null)}
        className="text-xs font-bold text-orange mb-3"
      >
        &larr; Elegir otra
      </button>

      {loadingDetail || !detail ? (
        <p className="text-sm text-steel">Cargando...</p>
      ) : (
        <>
          <div className="bg-white border border-line rounded-lg p-3 mb-3">
            <div className="font-bold text-lg">{detail.item.code}</div>
            <div className="text-sm text-steel">
              Actualmente en {detail.item.locationName} ({formatDays(detail.item.daysInLocation)})
            </div>
          </div>

          {detail.movements.length === 0 ? (
            <p className="text-sm text-steel">Sin movimientos registrados todavia.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {detail.movements.map((mv) => (
                <div key={mv.id} className="bg-white border border-line rounded-lg p-3">
                  <div className="text-sm">
                    <span className="text-steel">{mv.fromLocationName ?? "(sin registro previo)"}</span>
                    {" -> "}
                    <span className="font-bold">{mv.toLocationName}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-steel">{formatDateTime(mv.createdAt)}</span>
                    <span className="text-xs font-bold">
                      {mv.isOngoing
                        ? `lleva ${formatDays(mv.durationDays ?? 0)} ahi`
                        : `estuvo ${formatDays(mv.durationDays ?? 0)}`}
                    </span>
                  </div>
                  {mv.note && <div className="text-sm mt-1 italic text-ink/80">"{mv.note}"</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
