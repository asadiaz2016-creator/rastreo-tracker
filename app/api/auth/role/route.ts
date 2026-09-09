import { NextResponse } from "next/server";
import { getRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const role = await getRole();
  return NextResponse.json({ role });
}
