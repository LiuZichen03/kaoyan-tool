import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/storage";
import { Question } from "@/lib/types";

const QA_FILE = "qa/questions.json";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const subject = request.nextUrl.searchParams.get("subject");
  const status = request.nextUrl.searchParams.get("status");

  let questions = await readJson<Question[]>(QA_FILE);
  if (!questions) questions = [];

  if (subject) questions = questions.filter((q) => q.subject === subject);
  if (status === "pending") questions = questions.filter((q) => q.status === "pending");

  questions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ success: true, data: questions });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: Question = await request.json();
  let questions = await readJson<Question[]>(QA_FILE);
  if (!questions) questions = [];

  const idx = questions.findIndex((q) => q.id === body.id);
  if (idx >= 0) {
    questions[idx] = body;
  } else {
    questions.push(body);
  }

  await writeJson(QA_FILE, questions);
  return NextResponse.json({ success: true, data: body });
}
