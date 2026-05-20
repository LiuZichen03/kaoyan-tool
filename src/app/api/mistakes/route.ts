import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { Mistake, ApiResponse, SubjectId } from "@/lib/types";
import { isDueForReview } from "@/lib/spaced-rep";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Mistake[]>>> {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject") as SubjectId | null;
  const review = searchParams.get("review");
  const date = searchParams.get("date");

  const subjects: SubjectId[] = subject ? [subject] : ["politics", "english", "math", "cs"];
  let all: Mistake[] = [];

  for (const s of subjects) {
    const mistakes = await readJson<Mistake[]>(`mistakes/${s}.json`);
    if (mistakes) all = all.concat(mistakes);
  }

  if (review === "due") {
    all = all.filter(isDueForReview);
  }

  if (date) {
    all = all.filter((m) => m.createdAt.startsWith(date));
  }

  return NextResponse.json({ success: true, data: all });
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Mistake>>> {
  const mistake: Mistake = await request.json();
  const filePath = `mistakes/${mistake.subject}.json`;

  const existing = await readJson<Mistake[]>(filePath);
  const list = existing || [];

  const index = list.findIndex((m) => m.id === mistake.id);
  if (index >= 0) {
    list[index] = mistake;
  } else {
    list.push(mistake);
  }

  await writeJson(filePath, list);
  return NextResponse.json({ success: true, data: mistake });
}
