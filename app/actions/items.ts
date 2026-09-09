"use server";

import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { ItemType } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  codes: z.array(z.string().trim().min(1)).min(1),
  type: z.nativeEnum(ItemType),
});

export async function agregarItems(input: {
  codes: string[];
  type: ItemType;
}): Promise<{ ok: true; agregados: number; omitidos: string[] } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: "Se requiere modo administrador." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos invalidos." };

  const codes = Array.from(new Set(parsed.data.codes.map((c) => c.toUpperCase())));

  const patio = await prisma.location.findFirst({ where: { isDefault: true } });
  if (!patio) return { ok: false, error: "No existe la ubicacion Patio." };

  const existentes = await prisma.item.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const existentesSet = new Set(existentes.map((e) => e.code));
  const nuevos = codes.filter((c) => !existentesSet.has(c));

  if (nuevos.length > 0) {
    await prisma.item.createMany({
      data: nuevos.map((code) => ({
        code,
        type: parsed.data.type,
        currentLocationId: patio.id,
      })),
    });
  }

  return { ok: true, agregados: nuevos.length, omitidos: [...existentesSet] };
}

export async function eliminarItem(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: "Se requiere modo administrador." };
  }

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return { ok: false, error: "No se encontro esa caja/plataforma." };

  // Borra tambien su historial de movimientos (onDelete: Cascade en el schema).
  await prisma.item.delete({ where: { id } });

  return { ok: true };
}
