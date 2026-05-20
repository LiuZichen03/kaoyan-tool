"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DailyBriefing, SubjectId } from "@/lib/types";
import BriefingCard from "@/components/dashboard/BriefingCard";
import TodayFocus from "@/components/dashboard/TodayFocus";

const SUBJECT_NAMES: Record<SubjectId, string> = {
  politics: "政治", english: "英语", math: "数学", cs: "专业课",
};

const PROGRESS_COLORS: Record<SubjectId, string> = {
  math: "bg-amber-500", cs: "bg-emerald-500", english: "bg-blue-500", politics: "bg-red-500",
};

const ALERT_STYLES: Record<string, string> = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

function getWeekday(dateStr: string): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[new Date(dateStr + "T00:00:00").getDay()];
}

export default function DashboardPage() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/briefing")
      .then((r) => r.json())
      .then((json) => {
        setBriefing(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        加载中...
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        无法加载简报
      </div>
    );
  }

  const {
    date, currentPhase, phaseDay, phaseDaysLeft, daysLeft,
    todayFocus, alerts, mistakeProfile, progress,
    streak, yesterdayHours, yesterdayReflection, dailyQuote,
  } = briefing;
  const weekday = getWeekday(date);

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">
            {date} {weekday}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {currentPhase} · 第 {phaseDay} 天 · 距阶段结束 {phaseDaysLeft} 天 · 距考研 {daysLeft} 天
          </p>
        </div>
        <span className="text-sm text-zinc-400">目标 410</span>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {/* Today's Focus */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📋</span>
            <h3 className="text-sm font-semibold text-zinc-800">今日建议</h3>
            {todayFocus.length === 0 && (
              <span className="text-xs text-zinc-400">去备考计划页设置里程碑，我会自动生成建议</span>
            )}
          </div>
          <BriefingCard>
            <TodayFocus items={todayFocus} />
          </BriefingCard>
        </section>

        {alerts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">⚠️</span>
              <h3 className="text-sm font-semibold text-zinc-800">注意</h3>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`text-xs px-4 py-2.5 rounded-lg border ${ALERT_STYLES[a.level]}`}>
                  {a.message}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Progress */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📊</span>
            <h3 className="text-sm font-semibold text-zinc-800">章节进度</h3>
            <Link href="/progress" className="text-xs text-zinc-400 hover:text-zinc-600 ml-auto">
              查看全部 →
            </Link>
          </div>
          <BriefingCard>
            <div className="grid grid-cols-4 gap-4">
              {progress.map((p) => {
                const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                return (
                  <div key={p.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">{SUBJECT_NAMES[p.subject]}</span>
                      <span className="text-xs font-medium text-zinc-700">
                        {p.completed}/{p.total}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${PROGRESS_COLORS[p.subject]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </BriefingCard>
        </section>

        {/* Stats row */}
        <section className="mb-6 grid grid-cols-3 gap-3">
          <BriefingCard>
            <div className="text-xs text-zinc-400 mb-1">连续学习</div>
            <div className="text-xl font-bold text-zinc-900">{streak} 天</div>
          </BriefingCard>
          <BriefingCard>
            <div className="text-xs text-zinc-400 mb-1">昨日学习</div>
            <div className="text-xl font-bold text-zinc-900">{yesterdayHours || 0}h</div>
          </BriefingCard>
          <BriefingCard>
            <div className="text-xs text-zinc-400 mb-1">错题总数</div>
            <div className="text-xl font-bold text-zinc-900">
              {mistakeProfile.reduce((s, m) => s + m.total, 0)} 道
            </div>
          </BriefingCard>
        </section>

        {/* Mistake Profile */}
        {mistakeProfile.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🧠</span>
              <h3 className="text-sm font-semibold text-zinc-800">错题画像</h3>
            </div>
            <div className="space-y-2">
              {mistakeProfile.map((mp) => (
                <BriefingCard key={mp.subject}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-zinc-700">{SUBJECT_NAMES[mp.subject]}</span>
                    <span className="text-[10px] text-zinc-400">{mp.total} 道</span>
                    <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      {mp.topWrongTag}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate">最多错：{mp.topWrongChapter}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{mp.insight}</p>
                </BriefingCard>
              ))}
            </div>
          </section>
        )}

        {/* Reflection */}
        {yesterdayReflection && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📝</span>
              <h3 className="text-sm font-semibold text-zinc-800">昨日反思</h3>
            </div>
            <BriefingCard>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{yesterdayReflection}</p>
            </BriefingCard>
          </section>
        )}

        {/* Daily Quote */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">💡</span>
            <h3 className="text-sm font-semibold text-zinc-800">导师的话</h3>
          </div>
          <BriefingCard className="bg-zinc-50 border-zinc-200">
            <p className="text-sm text-zinc-700 leading-relaxed">{dailyQuote}</p>
          </BriefingCard>
        </section>

        {/* Quick links */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-zinc-100">
          <Link href="/daily" className="text-xs text-zinc-400 hover:text-zinc-600">每日规划 →</Link>
          <Link href="/mistakes" className="text-xs text-zinc-400 hover:text-zinc-600">错题本 →</Link>
          <Link href="/stats" className="text-xs text-zinc-400 hover:text-zinc-600">学习统计 →</Link>
          <Link href="/plan" className="text-xs text-zinc-400 hover:text-zinc-600">备考计划 →</Link>
        </div>
      </div>
    </div>
  );
}
