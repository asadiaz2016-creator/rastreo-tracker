"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ItemType } from "@prisma/client";
import type { ItemDTO, LocationDTO } from "@/lib/types";
import { agregarItems, eliminarItem } from "@/app/actions/items";
import { agregarDestino, eliminarDestino } from "@/app/actions/locations";
import { useRole } from "@/components/RoleContext";
import { PinModal } from "@/components/PinModal";

export default function AdministrarPage() {
  const { role } = useRole();
  const [showPinModal, setShowPinModal] = useState(false);
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);

  const [bulkText, setBulkText] = useState("");
  const [bulkType, setBulkType] = useState<ItemType>(ItemType.CAJA);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [savingBulk, setSavingBulk] = useState(false);

  const [nuevoDestino, setNuevoDestino] = useState("");
  const [destinoMsg, setDestinoMsg] = useState<string | null>(null);
  const [savingDestino, setSavingDestino] = useState(false);

  const [itemSearch, setItemSearch] = useState("");
  const [itemMsg, setItemMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const [itemsRes, locsRes] = await Promise.all([
      fetch("/api/items", { cache: "no-store" }),
      fetch("/api/locations", { cache: "no-store" }),
    ]);
    setItems(await itemsRes.json());
    setLocations(await locsRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  const totalCajas = items.filter((i) => i.type === "CAJA").length;
  const totalPlataformas = items.filter((i) => i.type === "PLATAFORMA").length;

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const codes = bulkText
      .split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length === 0) return;
    setSavingBulk(true);
    setBulkMsg(null);
    const result = await agregarItems({ codes, type: bulkType });
    setSavingBulk(false);
    if (result.ok) {
      setBulkMsg(
        `${result.agregados} agregada(s).` +
          (result.omitidos.length > 0 ? ` Ya existian: ${result.omitidos.join(", ")}.` : ""),
      );
      setBulkText("");
      load();
    } else {
      setBulkMsg(result.error);
    }
  }

  async function handleAgregarDestino(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoDestino.trim()) return;
    setSavingDestino(true);
    setDestinoMsg(null);
    const result = await agregarDestino({ name: nuevoDestino.trim() });
    setSavingDestino(false);
    if (result.ok) {
      setNuevoDestino("");
      load();
    } else {
      setDestinoMsg(result.error);
    }
  }

  async function handleEliminarDestino(id: string) {
    setDestinoMsg(null);
    const result = await eliminarDestino(id);
    if (!result.ok) setDestinoMsg(result.error);
    load();
  }

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    const list = q ? items.filter((i) => i.code.toLowerCase().includes(q)) : items;
    return [...list].sort((a, b) => a.code.localeCompare(b.code)).slice(0, 30);
  }, [items, itemSearch]);

  async function handleEliminarItem(item: ItemDTO) {
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar ${item.code}? Esto borra tambien su historial de movimientos y no se puede deshacer.`,
    );
    if (!confirmado) return;
    setItemMsg(null);
    setDeletingId(item.id);
    const result = await eliminarItem(item.id);
    setDeletingId(null);
    if (!result.ok) {
      setItemMsg(result.error);
    } else {
      setItemMsg(`${item.code} eliminada.`);
    }
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-steel mb-2">Totales</h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-line rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold">{totalCajas}</div>
            <div className="text-xs text-steel">Cajas</div>
          </div>
          <div className="flex-1 bg-white border border-line rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold">{totalPlataformas}</div>
            <div className="text-xs text-steel">Plataformas</div>
          </div>
        </div>
      </section>

      {role !== "ADMIN" && (
        <div className="bg-amber/10 border border-amber rounded-lg p-3 flex items-center justify-between gap-2">
          <p className="text-sm text-ink">
            Solo en modo administrador se pueden agregar unidades o destinos.
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

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-steel mb-2">
          Agregar cajas/plataformas
        </h2>
        <fieldset disabled={role !== "ADMIN"} className="disabled:opacity-60">
        <form onSubmit={handleBulkSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            {([ItemType.CAJA, ItemType.PLATAFORMA] as ItemType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBulkType(t)}
                className={clsx(
                  "flex-1 rounded-md border px-2 py-2 text-xs font-bold",
                  bulkType === t ? "bg-ink text-paper border-ink" : "bg-white border-line",
                )}
              >
                {t === ItemType.CAJA ? "Caja" : "Plataforma"}
              </button>
            ))}
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Uno por linea o separados por coma, ej:\nCCP500\nCCP501"}
            rows={4}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          />
          {bulkMsg && <p className="text-sm font-bold text-steel">{bulkMsg}</p>}
          <button
            type="submit"
            disabled={savingBulk}
            className="self-start rounded-md bg-orange text-white font-bold px-4 py-2 disabled:opacity-40"
          >
            {savingBulk ? "Guardando..." : "Agregar"}
          </button>
        </form>
        </fieldset>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-steel mb-2">
          Eliminar cajas/plataformas
        </h2>
        <p className="text-sm text-steel mb-2">
          Para las que ya no se usan o se vendieron. Borra tambien su historial.
        </p>
        <input
          type="text"
          value={itemSearch}
          onChange={(e) => setItemSearch(e.target.value)}
          placeholder="Buscar por numero..."
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm mb-2"
        />
        {itemMsg && <p className="text-sm font-bold text-steel mb-2">{itemMsg}</p>}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white border border-line rounded-md px-3 py-2 text-sm"
            >
              <span>
                <span className="font-bold">{item.code}</span>{" "}
                <span className="text-steel">-- {item.locationName}</span>
              </span>
              {role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => handleEliminarItem(item)}
                  disabled={deletingId === item.id}
                  className="text-xs font-bold text-red disabled:opacity-40 whitespace-nowrap"
                >
                  {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                </button>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && <p className="text-sm text-steel">Sin resultados.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-steel mb-2">Destinos</h2>
        {role === "ADMIN" && (
          <form onSubmit={handleAgregarDestino} className="flex gap-2 mb-2">
            <input
              type="text"
              value={nuevoDestino}
              onChange={(e) => setNuevoDestino(e.target.value)}
              placeholder="Nuevo destino..."
              className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={savingDestino}
              className="rounded-md bg-ink text-paper font-bold px-4 py-2 text-sm disabled:opacity-40"
            >
              Agregar
            </button>
          </form>
        )}
        {destinoMsg && <p className="text-sm font-bold text-red mb-2">{destinoMsg}</p>}
        <div className="flex flex-col gap-1">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between bg-white border border-line rounded-md px-3 py-2 text-sm"
            >
              <span>
                {loc.name} <span className="text-steel">({loc.itemCount})</span>
              </span>
              {!loc.isDefault && role === "ADMIN" && (
                <button
                  type="button"
                  onClick={() => handleEliminarDestino(loc.id)}
                  className="text-xs font-bold text-red"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </div>
  );
}
