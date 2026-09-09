import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { startAdminSession } from "@/lib/session";

// Freno simple contra intentos por fuerza bruta del PIN. Suficiente para
// un solo contenedor con pocos dispositivos; no sobrevive un reinicio ni
// escala entre varias instancias.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;

function isThrottled(key: string) {
  const entry = attempts.get(key);
  const now = Date.now();
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const entry = attempts.get(key);
  if (entry) entry.count += 1;
}

function clearAttempts(key: string) {
  attempts.delete(key);
}

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";

  if (isThrottled(key)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return NextResponse.json({ ok: false, error: "App no configurada" }, { status: 500 });
  }

  const valid = pin.length > 0 && (await bcrypt.compare(pin, settings.adminPinHash));

  if (!valid) {
    recordFailure(key);
    return NextResponse.json({ ok: false, error: "PIN incorrecto" }, { status: 401 });
  }

  clearAttempts(key);
  await startAdminSession();
  return NextResponse.json({ ok: true });
}
