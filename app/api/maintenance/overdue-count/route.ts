import { NextResponse } from "next/server";
import { getOverdueMaintenanceCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await getOverdueMaintenanceCount();
  return NextResponse.json({ count });
}
