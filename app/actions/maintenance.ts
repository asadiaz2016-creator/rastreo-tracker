"use server";

import { prisma } from "@/lib/prisma";

export async function marcarMantenimientoHecho(
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!itemId) return { ok: false, error: "Falta el identificador." };
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false, error: "No se encontro esa caja/plataforma." };

  await prisma.item.update({
    where: { id: itemId },
    data: { lastMaintenanceAt: new Date() },
  });

  return { ok: true };
}
