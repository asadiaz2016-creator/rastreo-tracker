"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MaintenanceBanner() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/maintenance/overdue-count", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setCount(data.count);
      } catch {
        // silencioso: si falla, simplemente no se muestra el banner
      }
    }
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!count || count <= 0 || pathname?.startsWith("/mantenimiento")) return null;

  return (
    <Link
      href="/mantenimiento"
      className="block bg-red text-white text-center text-sm font-bold px-4 py-2"
    >
      {count === 1
        ? "1 unidad con mantenimiento vencido"
        : `${count} unidades con mantenimiento vencido`}{" "}
      -- ver detalle &rarr;
    </Link>
  );
}
