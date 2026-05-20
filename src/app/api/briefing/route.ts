import { NextResponse } from "next/server";
import { readJson, listJsonFiles } from "@/lib/storage";
import {
  DailyBriefing,
  DailyPlan,
  Mistake,
  PlanPhase,
  SubjectId,
  SubjectWeights,
  TodayFocusItem,
  BriefingAlert,
  MistakeProfile,
  ChapterWithProgress,
} from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";
import { getCountdownDays, todayLocal } from "@/lib/countdown";

const SUBJECTS: SubjectId[] = ["math", "cs", "english", "politics"];
const SUBJECT_NAMES: Record<SubjectId, string> = {
  math: "数学", cs: "专业课", english: "英语", politics: "政治",
};

function getWeekday(dateStr: string): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

function diffDays(from: string, to: string): number {
  return Math.ceil((new Date(to + "T00:00:00").getTime() - new Date(from + "T00:00:00").getTime()) / 86400000);
}

function getInsight(wrongTag: string, subjectName: string): string {
  const tips: Record<string, string> = {
    "概念混淆": `${subjectName}需要回归定义，把每个定理的条件和结论逐字读清楚`,
    "计算失误": `${subjectName}问题不在理解，在计算习惯——草稿纸分区、每步验算`,
    "审题偏差": `${subjectName}放慢读题速度，圈出关键词再看选项`,
    "遗漏条件": `${subjectName}做题前先列出题目给的所有条件，做完逐条对照`,
    "方法错误": `${subjectName}不是不会，是方法选错了——总结每种题型的标准解法`,
    "时间不足": `${subjectName}需要限时训练，按考试时间倒逼做题速度`,
    "完全不会": `${subjectName}建议先看对应章节视频，再回头做题`,
  };
  return tips[wrongTag] || `${subjectName}继续积累错题，样本还不够分析模式`;
}

export async function GET(): Promise<NextResponse> {
  const today = todayLocal();

  // --- Plan & phase ---
  const planData = await readJson<{ phases: PlanPhase[] }>("config/plan.json");
  const phases = planData?.phases || [];
  const currentPhase = phases.find((p) => today >= p.startDate && today <= p.endDate) || phases[0];
  const phaseDay = currentPhase ? Math.max(1, diffDays(currentPhase.startDate, today) + 1) : 1;
  const phaseDaysLeft = currentPhase ? diffDays(today, currentPhase.endDate) : 0;
  const daysLeft = getCountdownDays("2026-12-20");

  // --- Weights ---
  const weightData = await readJson<Record<SubjectId, SubjectWeights>>("config/exam-weights.json");

  // --- All daily plans ---
  const dailyDates = await listJsonFiles("daily");
  dailyDates.sort();
  const allPlans: DailyPlan[] = [];
  let yesterdayPlan: DailyPlan | null = null;
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

  for (const d of dailyDates) {
    const plan = await readJson<DailyPlan>(`daily/${d}.json`);
    if (!plan) continue;
    allPlans.push(plan);
    if (plan.date === yesterday) yesterdayPlan = plan;
  }

  // --- Chapter progress ---
  const chapterMap = new Map<string, { subject: SubjectId | "other"; total: number; completed: number }>();
  for (const plan of allPlans) {
    for (const task of plan.tasks) {
      if (!task.chapter) continue;
      const existing = chapterMap.get(task.chapter);
      if (existing) {
        existing.total++;
        if (task.completed) existing.completed++;
      } else {
        chapterMap.set(task.chapter, { subject: task.subject, total: 1, completed: task.completed ? 1 : 0 });
      }
    }
  }

  // --- Streak ---
  let streak = 0;
  for (const d of [...dailyDates].sort().reverse()) {
    if (d > today) continue;
    const plan = allPlans.find((p) => p.date === d);
    if (!plan || plan.tasks.length === 0) break;
    if (plan.tasks.some((t) => t.completed)) streak++;
    else break;
  }

  // --- Yesterday ---
  const yesterdayHours = yesterdayPlan?.timeSpent
    ? Object.values(yesterdayPlan.timeSpent).reduce((a, b) => a + b, 0)
    : 0;

  // --- Today focus ---
  const todayFocus: TodayFocusItem[] = [];
  if (currentPhase) {
    let candidates = currentPhase.milestones.filter((m) => today >= m.startDate);

    // Phase hasn't started yet — show preview of upcoming
    if (candidates.length === 0) {
      candidates = currentPhase.milestones;
    }

    for (const milestone of candidates) {
      for (const ch of milestone.chapters) {
        const prog = chapterMap.get(ch);
        if (prog && prog.completed >= 1) continue;
        const w = weightData?.[milestone.subject]?.chapters?.[ch];
        const weight = w?.weight || 3;
        const reason = today >= milestone.startDate ? (w?.note || "") : `${milestone.startDate} 开始`;
        const timeEst: Record<SubjectId, string> = {
          math: "视频约1.7h（1.5倍速）+ 做题1h",
          cs: "课本+王道课后题 约2h",
          english: "单词30min + 长难句30min",
          politics: "7月才开始，现在不用看",
        };
        todayFocus.push({
          subject: milestone.subject,
          chapter: ch,
          weight,
          reason: reason.slice(0, 40),
          suggestedTime: timeEst[milestone.subject],
        });
        break;
      }
    }
  }
  todayFocus.sort((a, b) => b.weight - a.weight);

  // --- Alerts ---
  const alerts: BriefingAlert[] = [];
  if (streak === 0) {
    alerts.push({ level: "info", message: "今天是备考第一天，扎实开始比完美计划更重要" });
  } else if (streak >= 7) {
    alerts.push({ level: "info", message: `已连续学习 ${streak} 天，节奏稳定` });
  }
  if (yesterdayPlan) {
    const undone = yesterdayPlan.tasks.filter((t) => !t.completed);
    if (undone.length > 0) {
      alerts.push({ level: "warning", message: `昨天有 ${undone.length} 项任务未完成，今天优先补上` });
    }
  }

  // --- Progress ---
  const progress: ChapterWithProgress[] = SUBJECTS.map((s) => {
    let total = 0, completed = 0;
    for (const ch of CHAPTERS[s]) {
      total++;
      const prog = chapterMap.get(ch);
      if (prog && prog.completed > 0) completed++;
    }
    return { subject: s, chapter: s, total, completed };
  });

  // --- Mistake profile ---
  const mistakeProfile: MistakeProfile[] = [];
  for (const s of SUBJECTS) {
    const mistakes = await readJson<Mistake[]>(`mistakes/${s}.json`);
    if (!mistakes || mistakes.length === 0) continue;
    const tagCounts = new Map<string, number>();
    const chCounts = new Map<string, number>();
    for (const m of mistakes) {
      if (m.wrongTag) tagCounts.set(m.wrongTag, (tagCounts.get(m.wrongTag) || 0) + 1);
      chCounts.set(m.chapter, (chCounts.get(m.chapter) || 0) + 1);
    }
    let topTag = "", maxTag = 0;
    for (const [t, c] of tagCounts) { if (c > maxTag) { topTag = t; maxTag = c; } }
    let topChapter = "", maxCh = 0;
    for (const [ch, c] of chCounts) { if (c > maxCh) { topChapter = ch; maxCh = c; } }

    mistakeProfile.push({
      subject: s,
      topWrongTag: topTag || "未标注",
      topWrongChapter: topChapter || "无",
      total: mistakes.length,
      insight: getInsight(topTag, SUBJECT_NAMES[s]),
    });
  }

  // --- Daily quote ---
  const mathDone = progress.find((p) => p.subject === "math")?.completed || 0;
  const csDone = progress.find((p) => p.subject === "cs")?.completed || 0;
  const totalDone = progress.reduce((s, p) => s + p.completed, 0);
  const totalMistakes = mistakeProfile.reduce((s, m) => s + m.total, 0);

  let dailyQuote = "";
  if (totalDone === 0 && phaseDay === 1 && !todayFocus.some((f) => f.reason.startsWith("2026"))) {
    dailyQuote = "今天是基础阶段第1天。上午数学，下午专业课，晚上英语——保持这个节奏。每看完一讲视频，立刻做课后例题检验理解。";
  } else if (totalDone === 0) {
    dailyQuote = `基础阶段${phaseDay === 0 ? "明天" : "第" + phaseDay + "天"}开始。张宇30讲前3讲是极限理论，是整个高数的地基；DS先过线性表，代码题从链表反转开始练。`;
  } else if (phaseDaysLeft <= 14 && mathDone < 18) {
    dailyQuote = `基础阶段只剩 ${phaseDaysLeft} 天，数学才完成 ${mathDone}/30 讲。时间很紧了——优先保高数前12讲（一元微积分占考试40%），线代和概率可以放到强化阶段再补。`;
  } else if (mathDone > 0 && csDone === 0) {
    dailyQuote = `数学已经开始了（${mathDone} 讲），但专业课还没动。408 占 150 分，DS+计组是第一轮重点。每天至少给专业课留 2 小时，别让数学挤占全部时间。`;
  } else if (totalMistakes > 10 && mathDone > 5) {
    const worstSubj = mistakeProfile.sort((a, b) => b.total - a.total)[0];
    if (worstSubj) {
      dailyQuote = `${SUBJECT_NAMES[worstSubj.subject]}错题最多（${worstSubj.total} 道），主要问题是「${worstSubj.topWrongTag}」。${worstSubj.insight}。`;
    }
  } else if (streak >= 7 && yesterdayHours > 6) {
    dailyQuote = `连续 ${streak} 天，昨天学了 ${yesterdayHours}h。这个节奏走下去，基础阶段能提前完成。但注意别熬夜——睡眠不足第二天效率直接减半。`;
  } else if (mathDone >= 3) {
    dailyQuote = `数学已完成 ${mathDone} 讲。前 3 讲是极限和微分的基础，接下来第 4 讲开始讲求导计算——这是考试必考题，每一道都要动手算，不能用眼睛看。`;
  } else {
    dailyQuote = `今天完成了 ${totalDone} 个章节的学习。明天继续推进${todayFocus[0]?.chapter || "下一章"}。`;
  }

  return NextResponse.json({
    success: true,
    data: {
      date: today,
      currentPhase: currentPhase?.name || "备考阶段",
      phaseDay,
      phaseDaysLeft,
      daysLeft,
      todayFocus: todayFocus.slice(0, 4),
      alerts,
      mistakeProfile,
      progress,
      streak,
      yesterdayHours,
      yesterdayReflection: yesterdayPlan?.reflection || undefined,
      dailyQuote,
    } satisfies DailyBriefing,
  });
}
