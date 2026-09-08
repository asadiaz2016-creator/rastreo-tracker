import { NextResponse } from "next/server";
import { getLocationsDTO } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const locations = await getLocationsDTO();
  return NextResponse.json(locations);
}
