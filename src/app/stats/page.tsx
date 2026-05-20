"use client";

import { useState, useEffect } from "react";
import { StatsData, SubjectId, WeeklyStats } from "@/lib/types";

const SUBJECT_LABELS: Record<SubjectId, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
};

const SUBJECT_COLORS: Record<SubjectId, string> = {
  politics: "#ef4444",
  english: "#3b82f6",
  math: "#f59e0b",
  cs: "#10b981",
};

const SUBJECTS: SubjectId[] = ["math", "cs", "english", "politics"];

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats?weeks=4")
      .then((r) => r.json())
      .then((json) => {
        setStats(json.data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-zinc-400 text-sm">加载中...</div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-zinc-400 text-sm">暂无统计数据</div>
    );
  }

  const maxSubjectHours = Math.max(...SUBJECTS.map((s) => stats.hoursBySubject[s]), 1);

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">学习统计</h2>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-3 mb-8">
          <StatCard label="总学习时长" value={`${stats.totalHours}h`} />
          <StatCard label="任务完成率" value={`${stats.completionRate}%`} />
          <StatCard label="连续天数" value={`${stats.streak} 天`} />
          <StatCard label="错题总数" value={`${stats.totalMistakes} 道`} />
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-800 mb-4">各科时间分布</h3>
          <div className="space-y-3">
            {SUBJECTS.map((s) => {
              const hours = stats.hoursBySubject[s];
              const pct = maxSubjectHours > 0 ? (hours / maxSubjectHours) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-12 shrink-0">{SUBJECT_LABELS[s]}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: SUBJECT_COLORS[s],
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 w-12 text-right">{hours}h</span>
                </div>
              );
            })}
          </div>
          {stats.totalHours === 0 && (
            <p className="text-xs text-zinc-400 text-center mt-3">
              开始记录每日回顾中的学习时间后，这里会显示分布
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h3 className="text-sm font-semibold text-zinc-800 mb-4">最近 4 周趋势</h3>
          {stats.weekly.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">暂无数据</p>
          ) : (
            <WeeklyChart weekly={stats.weekly} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
      <div className="text-2xl font-bold text-zinc-900 mb-1">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}

function WeeklyChart({ weekly }: { weekly: WeeklyStats[] }) {
  const maxHours = Math.max(...weekly.map((w) => w.totalHours), 1);
  const chartW = 600;
  const chartH = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const barW =
    weekly.length > 0
      ? Math.min(60, (chartW - pad.left - pad.right) / weekly.length - 12)
      : 40;

  return (
    <div className="overflow-x-auto">
      <svg width={chartW} height={chartH} className="mx-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = pad.top + (chartH - pad.top - pad.bottom) * (1 - ratio);
          const val = Math.round(maxHours * ratio);
          return (
            <g key={ratio}>
              <line
                x1={pad.left}
                y1={y}
                x2={chartW - pad.right}
                y2={y}
                stroke="#f4f4f5"
                strokeWidth="1"
              />
              <text
                x={pad.left - 6}
                y={y + 4}
                textAnchor="end"
                className="text-[10px]"
                fill="#a1a1aa"
              >
                {val}h
              </text>
            </g>
          );
        })}

        {weekly.map((w, i) => {
          const x =
            pad.left + i * ((chartW - pad.left - pad.right) / weekly.length) + 6;
          const barH =
            maxHours > 0
              ? (w.totalHours / maxHours) * (chartH - pad.top - pad.bottom)
              : 0;
          const y = chartH - pad.bottom - barH;

          return (
            <g key={w.weekStart}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="4"
                fill="#18181b"
                opacity="0.85"
              />
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[10px]"
                fill="#52525b"
              >
                {w.totalHours}h
              </text>
              <text
                x={x + barW / 2}
                y={chartH - 6}
                textAnchor="middle"
                className="text-[10px]"
                fill="#a1a1aa"
              >
                {w.weekStart.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
