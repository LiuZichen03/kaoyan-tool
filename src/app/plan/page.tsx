"use client";

import { useState, useEffect } from "react";
import { PlanPhase, SubjectId } from "@/lib/types";

const SUBJECT_LABELS: Record<SubjectId, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
};

const SUBJECT_COLORS: Record<SubjectId, string> = {
  politics: "bg-red-100 text-red-700 border-red-200",
  english: "bg-blue-100 text-blue-700 border-blue-200",
  math: "bg-amber-100 text-amber-700 border-amber-200",
  cs: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function PlanPage() {
  const [phases, setPhases] = useState<PlanPhase[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((json) => {
        const data = json.data || [];
        setPhases(data);
        const today = new Date().toISOString().split("T")[0];
        const current = data.find(
          (p: PlanPhase) => today >= p.startDate && today <= p.endDate
        );
        setSelectedPhase(current?.id || data[0]?.id || "");
        setLoading(false);
      });
  }, []);

  const phase = phases.find((p) => p.id === selectedPhase);

  function formatDate(d: string) {
    return d.slice(5);
  }

  if (loading) {
    return (
      <div className="p-8 text-zinc-400 text-sm">加载中...</div>
    );
  }

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">备考计划</h2>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {phases.map((p) => {
            const today = new Date().toISOString().split("T")[0];
            const isCurrent = today >= p.startDate && today <= p.endDate;
            const isPast = today > p.endDate;
            const isSelected = selectedPhase === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPhase(p.id)}
                className={`shrink-0 px-4 py-3 rounded-xl border text-left min-w-[140px] transition-colors ${
                  isSelected
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : isPast
                    ? "border-zinc-200 bg-zinc-50 text-zinc-400"
                    : isCurrent
                    ? "border-amber-300 bg-amber-50 text-zinc-800"
                    : "border-zinc-200 bg-white text-zinc-500"
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {isCurrent && "● "}
                  {p.name}
                </div>
                <div className="text-[10px] opacity-60">
                  {formatDate(p.startDate)} — {formatDate(p.endDate)}
                </div>
              </button>
            );
          })}
        </div>

        {phase && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-800 mb-1">
              {phase.name}里程碑
            </h3>
            {phase.milestones.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-zinc-200 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${SUBJECT_COLORS[m.subject]}`}
                  >
                    {SUBJECT_LABELS[m.subject]}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(m.startDate)} — {formatDate(m.endDate)}
                  </span>
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                      m.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {m.completed ? "已完成" : "进行中"}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-800">{m.title}</p>
                {m.chapters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.chapters.slice(0, 6).map((c) => (
                      <span
                        key={c}
                        className="text-[10px] text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded"
                      >
                        {c}
                      </span>
                    ))}
                    {m.chapters.length > 6 && (
                      <span className="text-[10px] text-zinc-400">
                        +{m.chapters.length - 6} 章
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
