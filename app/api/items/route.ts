import { NextResponse } from "next/server";
import { getItemsDTO } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getItemsDTO();
  return NextResponse.json(items);
}
