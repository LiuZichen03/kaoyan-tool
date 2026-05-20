import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { DailyPlan, ApiResponse } from "@/lib/types";
import { todayLocal } from "@/lib/countdown";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DailyPlan>>> {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayLocal();

  const plan = await readJson<DailyPlan>(`daily/${date}.json`);

  return NextResponse.json({
    success: true,
    data: plan || { date, tasks: [] },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DailyPlan>>> {
  const body: DailyPlan = await request.json();
  await writeJson(`daily/${body.date}.json`, body);

  return NextResponse.json({ success: true, data: body });
}
