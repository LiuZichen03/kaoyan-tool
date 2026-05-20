"use client";

import { useState, useEffect } from "react";
import { Question, SubjectId } from "@/lib/types";

const SUBJECTS: { id: SubjectId | "all"; name: string }[] = [
  { id: "all", name: "全部" },
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
  { id: "english", name: "英语" },
  { id: "politics", name: "政治" },
];

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-amber-100 text-amber-700",
  cs: "bg-emerald-100 text-emerald-700",
  english: "bg-blue-100 text-blue-700",
  politics: "bg-red-100 text-red-700",
};

export default function QAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<SubjectId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "answered">("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("subject", filter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/qa?${params}`);
    const json = await res.json();
    setQuestions(json.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter, statusFilter]);

  const pending = questions.filter((q) => q.status === "pending").length;

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">随学随问</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            学习时遇到问题记下来，下次打开 Claude Code 我会逐一回答
          </p>
        </div>
        {pending > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            {pending} 个待回答
          </span>
        )}
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex gap-2 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SubjectId | "all")}
            className="text-xs px-3 py-2 border border-zinc-200 rounded-lg"
          >
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "answered")}
            className="text-xs px-3 py-2 border border-zinc-200 rounded-lg"
          >
            <option value="all">全部状态</option>
            <option value="pending">待回答</option>
            <option value="answered">已回答</option>
          </select>
        </div>

        {loading ? (
          <p className="text-zinc-400 text-sm">加载中...</p>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-sm">
            <p className="text-4xl mb-3">?</p>
            <p>还没有问题</p>
            <p className="text-xs mt-1">在每日规划页右下角点 ? 按钮提问</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-4 ${
                  q.status === "answered" ? "border-green-200" : "border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${SUBJECT_COLORS[q.subject] || "bg-zinc-100 text-zinc-600"}`}>
                    {SUBJECTS.find((s) => s.id === q.subject)?.name || q.subject}
                  </span>
                  {q.chapter && <span className="text-[10px] text-zinc-400 truncate">{q.chapter}</span>}
                  <span className="ml-auto text-[10px] text-zinc-400">{q.createdAt.slice(0, 10)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    q.status === "answered" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {q.status === "answered" ? "已答" : "待答"}
                  </span>
                </div>

                {q.imagePath && (
                  <img src={q.imagePath} alt="问题截图" className="w-full rounded-lg border border-zinc-200 max-h-64 object-contain bg-zinc-50 mb-2" />
                )}
                <p className="text-sm text-zinc-800 whitespace-pre-wrap">{q.question}</p>

                {q.answer && (
                  <div className="mt-3 p-3 bg-zinc-50 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">回答</p>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">{q.answer}</p>
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
