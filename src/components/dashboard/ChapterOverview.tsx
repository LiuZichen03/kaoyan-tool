"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SubjectId } from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";

const SUBJECT_LABELS: Record<SubjectId, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
};

const SUBJECT_COLORS: Record<SubjectId, string> = {
  math: "bg-amber-500",
  cs: "bg-emerald-500",
  english: "bg-blue-500",
  politics: "bg-red-500",
};

const SUBJECTS: SubjectId[] = ["math", "cs", "english", "politics"];

export default function ChapterOverview() {
  const [chapterData, setChapterData] = useState<Record<SubjectId, { done: number; total: number }> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const listRes = await fetch("/api/daily/list");
        const listJson = await listRes.json();
        const dates: string[] = listJson.data || [];

        const chapterCompletions = new Map<string, Set<string>>();

        const plans = await Promise.all(
          dates.map(async (d) => {
            const res = await fetch(`/api/daily?date=${d}`);
            const json = await res.json();
            return json.data;
          })
        );

        for (const plan of plans) {
          if (!plan?.tasks) continue;
          for (const task of plan.tasks) {
            if (!task.chapter || !task.completed) continue;
            if (!chapterCompletions.has(task.chapter)) {
              chapterCompletions.set(task.chapter, new Set());
            }
            chapterCompletions.get(task.chapter)!.add(task.id);
          }
        }

        const result: Record<string, { done: number; total: number }> = {};
        for (const s of SUBJECTS) {
          const chapters = CHAPTERS[s];
          const done = chapters.filter((c) => (chapterCompletions.get(c)?.size || 0) > 0).length;
          result[s] = { done, total: chapters.length };
        }
        setChapterData(result);
      } catch {
        // silently fail if no data
      }
    }
    load();
  }, []);

  if (!chapterData) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-800">章节进度概览</h3>
        <Link href="/progress" className="text-xs text-zinc-400 hover:text-zinc-600">
          查看全部 →
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {SUBJECTS.map((s) => {
          const data = chapterData[s];
          const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
          return (
            <div key={s}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">{SUBJECT_LABELS[s]}</span>
                <span className="text-xs font-medium text-zinc-700">
                  {data.done}/{data.total}
                </span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${SUBJECT_COLORS[s]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
