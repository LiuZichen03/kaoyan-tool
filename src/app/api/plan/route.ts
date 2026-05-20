import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { PlanPhase } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  const data = await readJson<{ phases: PlanPhase[] }>("config/plan.json");
  if (!data) {
    return NextResponse.json({ success: false, error: "Plan not found" });
  }
  return NextResponse.json({ success: true, data: data.phases });
}
