"use client";

import Link from "next/link";
import { Mistake, SubjectId } from "@/lib/types";

const SUBJECT_LABELS: Record<SubjectId, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
};

const SUBJECT_COLORS: Record<SubjectId, string> = {
  politics: "bg-red-100 text-red-700",
  english: "bg-blue-100 text-blue-700",
  math: "bg-amber-100 text-amber-700",
  cs: "bg-emerald-100 text-emerald-700",
};

export default function ReviewReminder({ queue }: { queue: Mistake[] }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-800">待复习错题</h3>
        <Link href="/mistakes" className="text-xs text-zinc-400 hover:text-zinc-600">
          错题本 →
        </Link>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          暂无待复习错题
        </div>
      ) : (
        <ul className="space-y-2">
          {queue.slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="flex-1 text-zinc-700 truncate">{(m.source || m.chapter).slice(0, 30)}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${SUBJECT_COLORS[m.subject]}`}>
                {SUBJECT_LABELS[m.subject]}
              </span>
            </li>
          ))}
          {queue.length > 5 && (
            <li className="text-xs text-zinc-400 text-center">
              ...还有 {queue.length - 5} 道待复习
            </li>
          )}
        </ul>
      )}

      {queue.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            今日应复习 <strong className="text-zinc-800">{queue.length}</strong> 道错题
          </p>
        </div>
      )}
    </div>
  );
}
