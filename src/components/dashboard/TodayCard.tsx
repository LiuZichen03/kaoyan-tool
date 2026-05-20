"use client";

import Link from "next/link";
import { DailyPlan, TaskSubject } from "@/lib/types";

const SUBJECT_LABELS: Record<TaskSubject, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
  other: "杂事",
};

const SUBJECT_COLORS: Record<TaskSubject, string> = {
  politics: "bg-red-100 text-red-700",
  english: "bg-blue-100 text-blue-700",
  math: "bg-amber-100 text-amber-700",
  cs: "bg-emerald-100 text-emerald-700",
  other: "bg-zinc-100 text-zinc-600",
};

export default function TodayCard({
  plan,
  completion,
}: {
  plan: DailyPlan | null;
  completion: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-800">今日任务</h3>
        <Link href="/daily" className="text-xs text-zinc-400 hover:text-zinc-600">
          查看全部 →
        </Link>
      </div>

      {!plan || plan.tasks.length === 0 ? (
        <div className="text-center py-8 text-zinc-400">
          <p className="text-sm">还没有计划</p>
          <Link href="/daily" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
            去添加今日任务
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {plan.tasks.slice(0, 5).map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  task.completed ? "bg-zinc-300" : "bg-green-500"
                }`}
              />
              <span className={`flex-1 ${task.completed ? "line-through text-zinc-400" : "text-zinc-700"}`}>
                {task.title}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${SUBJECT_COLORS[task.subject]}`}>
                {SUBJECT_LABELS[task.subject]}
              </span>
            </li>
          ))}
          {plan.tasks.length > 5 && (
            <li className="text-xs text-zinc-400 text-center">
              ...还有 {plan.tasks.length - 5} 项
            </li>
          )}
        </ul>
      )}

      {completion > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>完成进度</span>
            <span>{completion}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div
              className="bg-zinc-800 h-2 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
