"use client";

import { useState } from "react";
import clsx from "clsx";
import { useRole } from "@/components/RoleContext";
import { PinModal } from "@/components/PinModal";

export default function RoleBadge() {
  const { role, loading, switchToConsulta } = useRole();
  const [showPinModal, setShowPinModal] = useState(false);

  if (loading) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            role === "ADMIN" ? "bg-orange text-white" : "bg-white/10 text-paper",
          )}
        >
          {role === "ADMIN" ? "Administrador" : "Consulta"}
        </span>
        {role === "ADMIN" ? (
          <button
            type="button"
            onClick={() => switchToConsulta()}
            className="text-[11px] font-bold text-paper/70 underline"
          >
            Salir
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="text-[11px] font-bold text-paper/70 underline"
          >
            Entrar como admin
          </button>
        )}
      </div>

      {showPinModal && <PinModal onClose={() => setShowPinModal(false)} />}
    </>
  );
}
