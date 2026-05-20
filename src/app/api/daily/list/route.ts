import { NextResponse } from "next/server";
import { listJsonFiles } from "@/lib/storage";

export async function GET(): Promise<NextResponse> {
  const dates = await listJsonFiles("daily");
  return NextResponse.json({ success: true, data: dates.sort() });
}
