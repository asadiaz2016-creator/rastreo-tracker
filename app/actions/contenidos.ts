"use server";

import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/session";
import { ADMIN_REQUIRED } from "@/lib/errors";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(1).max(100) });

export async function agregarContenido(
  input: { name: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: ADMIN_REQUIRED };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "El nombre no puede estar vacio." };

  const existente = await prisma.contenido.findUnique({ where: { name: parsed.data.name } });
  if (existente) return { ok: false, error: "Ya existe ese contenido." };

  const count = await prisma.contenido.count();
  await prisma.contenido.create({ data: { name: parsed.data.name, sortOrder: count } });

  return { ok: true };
}

// Borrar un contenido no borra historial: los movimientos que lo usaban
// se quedan sin contenido (onDelete: SetNull).
export async function eliminarContenido(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: ADMIN_REQUIRED };
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!contenido) return { ok: false, error: "No se encontro ese contenido." };
  if (contenido._count.items > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: hay ${contenido._count.items} caja(s) con ese contenido ahora mismo.`,
    };
  }

  await prisma.contenido.delete({ where: { id } });
  return { ok: true };
}

// Prende/apaga en un destino la pregunta de "que trae" al llegar.
export async function cambiarPideContenido(
  locationId: string,
  pideContenido: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if ((await getRole()) !== "ADMIN") {
    return { ok: false, error: ADMIN_REQUIRED };
  }

  await prisma.location.update({ where: { id: locationId }, data: { pideContenido } });
  return { ok: true };
}
