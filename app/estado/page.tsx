"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { ContenidoDTO, ItemDTO } from "@/lib/types";
import { formatDays } from "@/lib/format";
import { cambiarContenidoActual } from "@/app/actions/contenidos";
import { useRole } from "@/components/RoleContext";

type Filtro = "TODAS" | "CAJA" | "PLATAFORMA";

export default function EstadoPage() {
  const { role, runAdminAction } = useRole();
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [contenidos, setContenidos] = useState<ContenidoDTO[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<{ itemId: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [ordenarPorTiempo, setOrdenarPorTiempo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    fetch("/api/contenidos", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setContenidos(data);
      })
      .catch(() => {});
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleCambiarContenido(item: ItemDTO, contenido: ContenidoDTO) {
    setGuardandoId(item.id);
    setEditMsg(null);
    const result = await runAdminAction(() => cambiarContenidoActual(item.id, contenido.id));
    setGuardandoId(null);
    if (result.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, contenidoId: contenido.id, contenidoName: contenido.name } : i,
        ),
      );
      setEditandoId(null);
    } else {
      setEditMsg({ itemId: item.id, text: result.error });
    }
  }

  const filtered = useMemo(() => {
    let list = items;
    if (filtro !== "TODAS") list = list.filter((i) => i.type === filtro);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.locationName.toLowerCase().includes(q) ||
          (i.contenidoName?.toLowerCase().includes(q) ?? false),
      );
    }
    list = [...list];
    if (ordenarPorTiempo) {
      list.sort((a, b) => b.daysInLocation - a.daysInLocation);
    } else {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }
    return list;
  }, [items, search, filtro, ordenarPorTiempo]);

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por numero o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          {(["TODAS", "CAJA", "PLATAFORMA"] as Filtro[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={clsx(
                "flex-1 rounded-md border px-2 py-2 text-xs font-bold",
                filtro === f
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line",
              )}
            >
              {f === "TODAS" ? "Todas" : f === "CAJA" ? "Cajas" : "Plataformas"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOrdenarPorTiempo((v) => !v)}
          className={clsx(
            "rounded-md border px-3 py-2 text-xs font-bold self-start",
            ordenarPorTiempo ? "bg-orange text-white border-orange" : "bg-white border-line",
          )}
        >
          {ordenarPorTiempo ? "✓ " : ""}Ordenar: mas tiempo en el mismo destino primero
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-steel">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-steel">No se encontraron resultados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-line rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[15px]">{item.code}</span>
                <span
                  className={clsx(
                    "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded",
                    item.type === "CAJA" ? "bg-steel/15 text-steel" : "bg-amber/15 text-amber",
                  )}
                >
                  {item.type === "CAJA" ? "Caja" : "Plataforma"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-sm">
                <span>
                  {item.locationName}
                  {item.contenidoName && (
                    <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded bg-orange/15 text-orange">
                      {item.contenidoName}
                    </span>
                  )}
                </span>
                <span className="text-steel">{formatDays(item.daysInLocation)}</span>
              </div>
              {role === "ADMIN" && item.locationPideContenido && editandoId !== item.id && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(item.id);
                    setEditMsg(null);
                  }}
                  className="mt-1 text-xs font-bold text-orange"
                >
                  {item.contenidoName ? "Cambiar que trae" : "Poner que trae"}
                </button>
              )}
              {editandoId === item.id && (
                <div className="mt-2 border-t border-line pt-2">
                  <div className="text-xs font-bold uppercase tracking-wide text-steel mb-1">
                    ¿Que trae?
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {contenidos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        disabled={guardandoId === item.id}
                        onClick={() => handleCambiarContenido(item, c)}
                        className={clsx(
                          "rounded-md border px-2 py-2 text-sm font-bold disabled:opacity-40",
                          item.contenidoId === c.id
                            ? "bg-ink text-paper border-ink"
                            : "bg-white text-ink border-line",
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  {editMsg?.itemId === item.id && (
                    <p className="text-sm font-bold text-red mt-1">{editMsg.text}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="mt-2 text-xs font-bold text-steel"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
