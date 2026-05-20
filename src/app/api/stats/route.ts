import { NextRequest, NextResponse } from "next/server";
import { readJson, listJsonFiles } from "@/lib/storage";
import { DailyPlan, SubjectId, WeeklyStats, StatsData } from "@/lib/types";
import { todayLocal } from "@/lib/countdown";

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return fmtDate(d);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const weeksParam = request.nextUrl.searchParams.get("weeks") || "4";
  const maxWeeks = parseInt(weeksParam, 10);

  const dates = await listJsonFiles("daily");
  dates.sort();

  const plans: DailyPlan[] = [];
  for (const date of dates) {
    const plan = await readJson<DailyPlan>(`daily/${date}.json`);
    if (plan) plans.push(plan);
  }

  let totalHours = 0;
  const hoursBySubject: Record<SubjectId, number> = { politics: 0, english: 0, math: 0, cs: 0 };
  let totalTasks = 0;
  let completedTasks = 0;
  let streak = 0;

  const sortedDates = [...dates].sort().reverse();
  const today = todayLocal();
  for (const date of sortedDates) {
    if (date > today) continue;
    const plan = plans.find((p) => p.date === date);
    if (!plan || plan.tasks.length === 0) break;
    const hasCompleted = plan.tasks.some((t) => t.completed);
    if (hasCompleted) streak++;
    else break;
  }

  const weeklyMap = new Map<string, WeeklyStats>();

  for (const plan of plans) {
    if (plan.timeSpent) {
      for (const [subject, hours] of Object.entries(plan.timeSpent)) {
        const h = hours as number;
        totalHours += h;
        hoursBySubject[subject as SubjectId] += h;
      }
    }

    totalTasks += plan.tasks.length;
    completedTasks += plan.tasks.filter((t) => t.completed).length;

    const ws = getWeekStart(plan.date);
    if (!weeklyMap.has(ws)) {
      weeklyMap.set(ws, {
        weekStart: ws,
        totalHours: 0,
        hoursBySubject: { politics: 0, english: 0, math: 0, cs: 0 },
        completionRate: 0,
        mistakesCreated: 0,
      });
    }
    const week = weeklyMap.get(ws)!;
    if (plan.timeSpent) {
      for (const [subject, hours] of Object.entries(plan.timeSpent)) {
        week.hoursBySubject[subject as SubjectId] += hours as number;
        week.totalHours += hours as number;
      }
    }
  }

  const weekly: WeeklyStats[] = Array.from(weeklyMap.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-maxWeeks);

  const stats: StatsData = {
    totalHours: Math.round(totalHours * 10) / 10,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    streak,
    totalMistakes: 0,
    hoursBySubject,
    weekly,
  };

  try {
    const mistakeFiles = await listJsonFiles("mistakes");
    for (const subj of mistakeFiles) {
      const mistakes = await readJson(`mistakes/${subj}.json`);
      if (Array.isArray(mistakes)) stats.totalMistakes += mistakes.length;
    }
  } catch {
    // mistakes might not exist yet
  }

  for (const w of weekly) {
    const weekPlans = plans.filter((p) => getWeekStart(p.date) === w.weekStart);
    let wTotal = 0;
    let wCompleted = 0;
    for (const wp of weekPlans) {
      wTotal += wp.tasks.length;
      wCompleted += wp.tasks.filter((t) => t.completed).length;
      w.mistakesCreated += wp.mistakeIds?.length || 0;
    }
    w.completionRate = wTotal > 0 ? Math.round((wCompleted / wTotal) * 100) : 0;
  }

  return NextResponse.json({ success: true, data: stats });
}
