"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { ItemDTO, LocationDTO } from "@/lib/types";
import { registrarMovimiento } from "@/app/actions/movements";

export default function MovimientoPage() {
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [destinoId, setDestinoId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function loadData() {
    const [itemsRes, locsRes] = await Promise.all([
      fetch("/api/items", { cache: "no-store" }),
      fetch("/api/locations", { cache: "no-store" }),
    ]);
    setItems(await itemsRes.json());
    setLocations(await locsRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 20);
    return items.filter((i) => i.code.toLowerCase().includes(q)).slice(0, 20);
  }, [items, search]);

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || !destinoId) return;
    setSaving(true);
    setMessage(null);
    const result = await registrarMovimiento({ itemId: selectedItemId, toLocationId: destinoId, note });
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Movimiento registrado." });
      setSelectedItemId(null);
      setSearch("");
      setDestinoId("");
      setNote("");
      loadData();
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section>
        <label className="block text-xs font-bold uppercase tracking-wide text-steel mb-1">
          1. Selecciona la caja o plataforma
        </label>
        {selectedItem ? (
          <div className="bg-white border border-line rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="font-bold">{selectedItem.code}</span>
              <span className="text-sm text-steel"> -- actualmente en {selectedItem.locationName}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedItemId(null)}
              className="text-xs font-bold text-orange"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Buscar por numero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm mb-2"
            />
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
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
              {filteredItems.length === 0 && (
                <p className="text-sm text-steel">Sin resultados.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-steel mb-1">
            2. Nuevo destino
          </label>
          <select
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            required
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecciona un destino...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-steel mb-1">
            Nota (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
        </div>

        {message && (
          <p className={clsx("text-sm font-bold", message.type === "ok" ? "text-green" : "text-red")}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={!selectedItemId || !destinoId || saving}
          className="rounded-md bg-orange text-white font-bold px-4 py-3 disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Registrar movimiento"}
        </button>
      </form>
    </div>
  );
}
