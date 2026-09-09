"use client";

import { useState } from "react";
import { useRole } from "@/components/RoleContext";

export function PinModal({ onClose }: { onClose: () => void }) {
  const { switchToAdmin } = useRole();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "atras"];

  async function handleSubmit() {
    if (pin.length === 0) return;
    setSubmitting(true);
    setError(null);
    const result = await switchToAdmin(pin);
    setSubmitting(false);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? "PIN incorrecto");
      setPin("");
    }
  }

  function press(key: string) {
    if (key === "borrar") {
      setPin("");
    } else if (key === "atras") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 8) {
      setPin((p) => p + key);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ink">PIN de administrador</h2>
        <p className="mt-1 text-sm text-steel">
          Ingresa el PIN para poder registrar movimientos, marcar mantenimiento y administrar.
        </p>

        <div className="mt-4 flex h-14 items-center justify-center rounded-lg bg-paper2 text-2xl font-mono tracking-[0.5em] text-orange">
          {"•".repeat(pin.length) || <span className="text-steel/40">------</span>}
        </div>

        {error && <p className="mt-2 text-center text-sm font-bold text-red">{error}</p>}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {digits.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="rounded-xl bg-paper2 py-4 text-lg font-bold text-ink active:opacity-70"
            >
              {d === "borrar" ? "Borrar" : d === "atras" ? "⌫" : d}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line py-3 font-bold text-ink active:opacity-70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || pin.length === 0}
            className="rounded-xl bg-orange py-3 font-bold text-white disabled:opacity-50 active:opacity-80"
          >
            {submitting ? "Verificando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
