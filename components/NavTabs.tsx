"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/estado", label: "Estado actual" },
  { href: "/movimiento", label: "Registrar movimiento" },
  { href: "/historial", label: "Historial" },
  { href: "/mantenimiento", label: "Mantenimiento" },
  { href: "/administrar", label: "Administrar" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto bg-ink border-t border-[#3a3f37]">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex-none px-3 py-3 text-[12.5px] font-bold whitespace-nowrap border-b-[3px]",
              active ? "text-paper border-orange" : "text-[#a9ada2] border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
