"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ADMIN_REQUIRED } from "@/lib/errors";

export type Role = "CONSULTA" | "ADMIN";

type FailedResult = { ok: false; error: string };

type RoleContextValue = {
  role: Role;
  loading: boolean;
  switchToAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  switchToConsulta: () => Promise<void>;
  // Ejecuta una accion que modifica datos y siempre devuelve un resultado
  // (nunca lanza): si falla la conexion o la sesion de administrador ya
  // no es valida, devuelve un error con un mensaje claro para mostrarlo.
  runAdminAction: <T extends { ok: boolean }>(fn: () => Promise<T>) => Promise<T | FailedResult>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("CONSULTA");
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/role", { cache: "no-store" });
      const data = await res.json();
      setRole(data.role);
    } catch {
      // si falla, se queda con el rol que ya tenia
    }
  }, []);

  useEffect(() => {
    refreshRole().finally(() => setLoading(false));
  }, [refreshRole]);

  const switchToAdmin = useCallback(async (pin: string) => {
    const res = await fetch("/api/auth/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.ok) {
      setRole("ADMIN");
      return { ok: true };
    }
    return { ok: false, error: data.error ?? "PIN incorrecto" };
  }, []);

  const switchToConsulta = useCallback(async () => {
    await fetch("/api/auth/exit-admin", { method: "POST" });
    setRole("CONSULTA");
  }, []);

  const runAdminAction = useCallback(
    async <T extends { ok: boolean }>(fn: () => Promise<T>): Promise<T | FailedResult> => {
      try {
        const result = await fn();
        if (!result.ok && (result as { error?: string }).error === ADMIN_REQUIRED) {
          await refreshRole();
          return {
            ok: false,
            error: "Tu sesion de administrador expiro. Entra de nuevo con el PIN.",
          };
        }
        return result;
      } catch {
        return {
          ok: false,
          error:
            "No se pudo guardar. Recarga la pagina e intenta de nuevo; si sigue igual, revisa tu conexion.",
        };
      }
    },
    [refreshRole],
  );

  return (
    <RoleContext.Provider
      value={{ role, loading, switchToAdmin, switchToConsulta, runAdminAction }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole debe usarse dentro de RoleProvider");
  return ctx;
}
