"use server";

import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  itemId: z.string().min(1),
  toLocationId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
});

export async function registrarMovimiento(input: {
  itemId: string;
  toLocationId: string;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: "Se requiere modo administrador." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos invalidos." };
  const { itemId, toLocationId, note } = parsed.data;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, error: "No se encontro esa caja/plataforma." };

  const destino = await prisma.location.findUnique({ where: { id: toLocationId } });
  if (!destino) return { ok: false, error: "No se encontro ese destino." };

  await prisma.$transaction([
    prisma.movement.create({
      data: {
        itemId,
        fromLocationId: item.currentLocationId,
        toLocationId,
        note: note || null,
      },
    }),
    prisma.item.update({
      where: { id: itemId },
      data: { currentLocationId: toLocationId, currentLocationSince: new Date() },
    }),
  ]);

  return { ok: true };
}
