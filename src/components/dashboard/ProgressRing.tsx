"use client";

import { SubjectId } from "@/lib/types";

const COLORS: Record<SubjectId, { stroke: string; label: string }> = {
  politics: { stroke: "#ef4444", label: "政治" },
  english: { stroke: "#3b82f6", label: "英语" },
  math: { stroke: "#f59e0b", label: "数学" },
  cs: { stroke: "#10b981", label: "专业课" },
};

export default function ProgressRing({
  mistakesBySubject,
  totalMistakes,
}: {
  mistakesBySubject: Record<SubjectId, number>;
  totalMistakes: number;
}) {
  const subjects = Object.keys(COLORS) as SubjectId[];
  const circumference = 2 * Math.PI * 40;
  const total = totalMistakes || 1;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="font-semibold text-zinc-800 mb-4">错题分布</h3>
      {totalMistakes === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          暂无错题记录
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {subjects.map((s, i) => {
              const ratio = mistakesBySubject[s] / total;
              const offset = subjects
                .slice(0, i)
                .reduce((sum, prev) => sum + (mistakesBySubject[prev] / total) * circumference, 0);
              return (
                <circle
                  key={s}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={COLORS[s].stroke}
                  strokeWidth="10"
                  strokeDasharray={`${ratio * circumference} ${circumference - ratio * circumference}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                  className="opacity-80"
                />
              );
            })}
          </svg>
          <div className="space-y-1.5 text-xs">
            {subjects.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[s].stroke }}
                />
                <span className="text-zinc-600">{COLORS[s].label}</span>
                <span className="text-zinc-400">{mistakesBySubject[s]} 道</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
