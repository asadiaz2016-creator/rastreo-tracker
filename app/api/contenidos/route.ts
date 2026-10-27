import { NextResponse } from "next/server";
import { getContenidosDTO } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const contenidos = await getContenidosDTO();
  return NextResponse.json(contenidos);
}
