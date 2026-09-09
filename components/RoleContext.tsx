"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Role = "CONSULTA" | "ADMIN";

type RoleContextValue = {
  role: Role;
  loading: boolean;
  switchToAdmin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  switchToConsulta: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("CONSULTA");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/role")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <RoleContext.Provider value={{ role, loading, switchToAdmin, switchToConsulta }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole debe usarse dentro de RoleProvider");
  return ctx;
}
