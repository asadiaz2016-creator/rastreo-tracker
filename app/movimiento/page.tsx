"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { ContenidoDTO, ItemDTO, LocationDTO } from "@/lib/types";
import { registrarMovimiento } from "@/app/actions/movements";
import { useRole } from "@/components/RoleContext";
import { PinModal } from "@/components/PinModal";

export default function MovimientoPage() {
  const { role, runAdminAction } = useRole();
  const [showPinModal, setShowPinModal] = useState(false);
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoDTO[]>([]);
  const [destinoId, setDestinoId] = useState<string>("");
  const [contenidoId, setContenidoId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function loadData() {
    const [itemsRes, locsRes, contRes] = await Promise.all([
      fetch("/api/items", { cache: "no-store" }),
      fetch("/api/locations", { cache: "no-store" }),
      fetch("/api/contenidos", { cache: "no-store" }),
    ]);
    setItems(await itemsRes.json());
    setLocations(await locsRes.json());
    setContenidos(await contRes.json());
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
  const destino = locations.find((l) => l.id === destinoId) ?? null;
  const pideContenido = destino?.pideContenido ?? false;
  const faltaContenido = pideContenido && !contenidoId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || !destinoId || faltaContenido) return;
    setSaving(true);
    setMessage(null);
    const result = await runAdminAction(() =>
      registrarMovimiento({
        itemId: selectedItemId,
        toLocationId: destinoId,
        contenidoId: pideContenido ? contenidoId : undefined,
        note,
      }),
    );
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "ok", text: "Movimiento registrado." });
      setSelectedItemId(null);
      setSearch("");
      setDestinoId("");
      setContenidoId("");
      setNote("");
      loadData();
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {role !== "ADMIN" && (
        <div className="bg-amber/10 border border-amber rounded-lg p-3 flex items-center justify-between gap-2">
          <p className="text-sm text-ink">
            Solo en modo administrador se pueden registrar movimientos.
          </p>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="text-xs font-bold text-orange whitespace-nowrap"
          >
            Entrar como admin
          </button>
        </div>
      )}
      <fieldset disabled={role !== "ADMIN"} className="flex flex-col gap-4 disabled:opacity-60">
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
            onChange={(e) => {
              setDestinoId(e.target.value);
              setContenidoId("");
            }}
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

        {pideContenido && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-steel mb-1">
              3. ¿Que trae?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {contenidos.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setContenidoId(c.id)}
                  className={clsx(
                    "rounded-md border px-2 py-3 text-sm font-bold",
                    contenidoId === c.id
                      ? "bg-ink text-paper border-ink"
                      : "bg-white text-ink border-line",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
          disabled={!selectedItemId || !destinoId || faltaContenido || saving}
          className="rounded-md bg-orange text-white font-bold px-4 py-3 disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Registrar movimiento"}
        </button>
      </form>
      </fieldset>

      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </div>
  );
}
