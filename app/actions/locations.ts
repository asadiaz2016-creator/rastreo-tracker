"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(1).max(100) });

export async function agregarDestino(
  input: { name: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "El nombre no puede estar vacio." };

  const existente = await prisma.location.findUnique({ where: { name: parsed.data.name } });
  if (existente) return { ok: false, error: "Ya existe un destino con ese nombre." };

  const count = await prisma.location.count();
  await prisma.location.create({ data: { name: parsed.data.name, sortOrder: count } });

  return { ok: true };
}

export async function eliminarDestino(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const location = await prisma.location.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!location) return { ok: false, error: "No se encontro ese destino." };
  if (location.isDefault) return { ok: false, error: "Patio no se puede eliminar." };
  if (location._count.items > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: hay ${location._count.items} unidad(es) en ese destino ahora mismo.`,
    };
  }

  await prisma.location.delete({ where: { id } });
  return { ok: true };
}
