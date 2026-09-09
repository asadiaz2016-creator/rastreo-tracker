"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { ItemDTO } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { marcarMantenimientoHecho } from "@/app/actions/maintenance";
import { useRole } from "@/components/RoleContext";

const ORDEN_ESTATUS = { vencido: 0, proximo: 1, aldia: 2, sin_registro: 3 } as const;

const ESTILOS = {
  vencido: { badge: "bg-red text-white", label: "Vencido" },
  proximo: { badge: "bg-amber text-white", label: "Proximo a vencer" },
  aldia: { badge: "bg-green text-white", label: "Al dia" },
  sin_registro: { badge: "bg-steel/20 text-steel", label: "Sin registro" },
} as const;

export default function MantenimientoPage() {
  const { role } = useRole();
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/items", { cache: "no-store" });
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const diff = ORDEN_ESTATUS[a.maintenanceStatus] - ORDEN_ESTATUS[b.maintenanceStatus];
      if (diff !== 0) return diff;
      return (a.daysUntilMaintenance ?? 0) - (b.daysUntilMaintenance ?? 0);
    });
  }, [items]);

  async function marcarHecho(itemId: string) {
    setSavingId(itemId);
    await marcarMantenimientoHecho(itemId);
    await load();
    setSavingId(null);
  }

  if (loading) return <p className="text-sm text-steel">Cargando...</p>;

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => {
        const estilo = ESTILOS[item.maintenanceStatus];
        return (
          <div key={item.id} className="bg-white border border-line rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">{item.code}</span>
              <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded", estilo.badge)}>
                {estilo.label}
              </span>
            </div>
            <div className="text-sm text-steel mt-1">
              Ultimo mantenimiento: {formatDate(item.lastMaintenanceAt)}
              {item.nextMaintenanceDate && <> -- proximo: {formatDate(item.nextMaintenanceDate)}</>}
            </div>
            {role === "ADMIN" && (
              <button
                type="button"
                onClick={() => marcarHecho(item.id)}
                disabled={savingId === item.id}
                className="mt-2 text-xs font-bold rounded-md border border-line px-3 py-1.5 hover:border-orange disabled:opacity-40"
              >
                {savingId === item.id ? "Guardando..." : "Marcar hecho hoy"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
