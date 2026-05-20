"use client";

import { useState, useEffect } from "react";
import { SubjectId, ChapterWithProgress } from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";

const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
  { id: "english", name: "英语" },
  { id: "politics", name: "政治" },
];

const SUBJECT_COLORS: Record<SubjectId, string> = {
  politics: "bg-red-500",
  english: "bg-blue-500",
  math: "bg-amber-500",
  cs: "bg-emerald-500",
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<ChapterWithProgress[]>([]);
  const [activeSubject, setActiveSubject] = useState<SubjectId>("math");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const listRes = await fetch("/api/daily/list");
      const listJson = await listRes.json();
      const dates: string[] = listJson.data || [];

      const plans = await Promise.all(
        dates.map(async (d) => {
          const res = await fetch(`/api/daily?date=${d}`);
          const json = await res.json();
          return json.data;
        })
      );

      const chapterMap = new Map<string, { total: number; completed: number; subject: SubjectId }>();

      for (const plan of plans) {
        if (!plan?.tasks) continue;
        for (const task of plan.tasks) {
          if (!task.chapter) continue;
          const key = task.chapter;
          const existing = chapterMap.get(key);
          if (existing) {
            existing.total++;
            if (task.completed) existing.completed++;
          } else {
            chapterMap.set(key, {
              total: 1,
              completed: task.completed ? 1 : 0,
              subject: task.subject,
            });
          }
        }
      }

      for (const [subject, chapters] of Object.entries(CHAPTERS)) {
        for (const chapter of chapters) {
          if (!chapterMap.has(chapter)) {
            chapterMap.set(chapter, {
              total: 0,
              completed: 0,
              subject: subject as SubjectId,
            });
          }
        }
      }

      const result: ChapterWithProgress[] = [];
      for (const [chapter, data] of chapterMap) {
        result.push({
          subject: data.subject,
          chapter,
          total: data.total,
          completed: data.completed,
        });
      }

      setProgress(result);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = progress
    .filter((c) => c.subject === activeSubject)
    .sort((a, b) => a.chapter.localeCompare(b.chapter));

  const subjectStats = (id: SubjectId) => {
    const chapters = progress.filter((c) => c.subject === id);
    const done = chapters.filter((c) => c.total > 0 && c.completed >= c.total).length;
    const started = chapters.filter((c) => c.total > 0 && c.completed < c.total).length;
    const notStarted = chapters.filter((c) => c.total === 0).length;
    return { done, started, notStarted, total: chapters.length };
  };

  if (loading) {
    return (
      <div className="p-8 text-zinc-400 text-sm">加载中...</div>
    );
  }

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">章节进度</h2>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex gap-2 mb-6">
          {SUBJECTS.map((s) => {
            const stats = subjectStats(s.id);
            const isActive = activeSubject === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSubject(s.id)}
                className={`flex-1 px-4 py-3 rounded-xl border text-left transition-colors ${
                  isActive
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="text-sm font-medium">{s.name}</div>
                <div className={`text-[10px] mt-1 ${isActive ? "text-zinc-400" : "text-zinc-400"}`}>
                  {stats.done} 完成 · {stats.started} 进行中 · {stats.notStarted} 未开始
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            暂无章节数据
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map((c) => {
              const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
              const status =
                c.total === 0
                  ? "not_started"
                  : c.completed >= c.total
                  ? "completed"
                  : "in_progress";

              return (
                <div
                  key={c.chapter}
                  className={`bg-white rounded-xl border p-4 ${
                    status === "completed"
                      ? "border-green-200 bg-green-50/30"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        status === "completed"
                          ? "bg-green-500"
                          : status === "in_progress"
                          ? "bg-amber-400"
                          : "bg-zinc-300"
                      }`}
                    />
                    <span className="text-sm text-zinc-800 flex-1">{c.chapter}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        status === "completed"
                          ? "bg-green-100 text-green-700"
                          : status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {status === "completed"
                        ? "已完成"
                        : status === "in_progress"
                        ? "进行中"
                        : "未开始"}
                    </span>
                  </div>
                  {c.total > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${SUBJECT_COLORS[activeSubject]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 w-12 text-right">
                        {c.completed}/{c.total}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
