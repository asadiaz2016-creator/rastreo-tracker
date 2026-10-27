"use server";

import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { ADMIN_REQUIRED } from "@/lib/errors";
import { z } from "zod";

const schema = z.object({
  itemId: z.string().min(1),
  toLocationId: z.string().min(1),
  contenidoId: z.string().min(1).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function registrarMovimiento(input: {
  itemId: string;
  toLocationId: string;
  contenidoId?: string;
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: ADMIN_REQUIRED };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos invalidos." };
  const { itemId, toLocationId, contenidoId, note } = parsed.data;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, error: "No se encontro esa caja/plataforma." };

  const destino = await prisma.location.findUnique({ where: { id: toLocationId } });
  if (!destino) return { ok: false, error: "No se encontro ese destino." };

  // El contenido solo aplica a destinos que lo piden (CCP); en esos es
  // obligatorio, y en los demas se ignora.
  let contenido: string | null = null;
  if (destino.pideContenido) {
    if (!contenidoId) return { ok: false, error: "Selecciona que trae la caja." };
    const existe = await prisma.contenido.findUnique({ where: { id: contenidoId } });
    if (!existe) return { ok: false, error: "No se encontro ese contenido." };
    contenido = existe.id;
  }

  await prisma.$transaction([
    prisma.movement.create({
      data: {
        itemId,
        fromLocationId: item.currentLocationId,
        toLocationId,
        contenidoId: contenido,
        note: note || null,
      },
    }),
    prisma.item.update({
      where: { id: itemId },
      data: {
        currentLocationId: toLocationId,
        currentLocationSince: new Date(),
        currentContenidoId: contenido,
      },
    }),
  ]);

  return { ok: true };
}
