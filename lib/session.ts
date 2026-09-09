import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "role_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 dias

export type Role = "CONSULTA" | "ADMIN";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

// Lee la cookie firmada y la verifica en el servidor. Si falta, expiro, o
// la firma no es valida, cae a CONSULTA -- nunca se confia en un valor de
// rol que venga del cliente.
export async function getRole(): Promise<Role> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return "CONSULTA";

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.role === "ADMIN" ? "ADMIN" : "CONSULTA";
  } catch {
    return "CONSULTA";
  }
}

// Se llama solo despues de verificar el PIN contra el hash guardado en la
// base de datos (ver /api/auth/verify-pin). Emite una cookie firmada para
// que cada request futuro pueda confirmar acceso de administrador sin
// volver a pedir el PIN.
export async function startAdminSession() {
  const token = await new SignJWT({ role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

// Volver a modo consulta nunca requiere el PIN.
export async function endAdminSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
