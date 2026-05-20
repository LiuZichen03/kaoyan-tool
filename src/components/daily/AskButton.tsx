"use client";

import { useState, useRef } from "react";
import { SubjectId, Question } from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";

const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
  { id: "english", name: "英语" },
  { id: "politics", name: "政治" },
];

export default function AskButton() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<SubjectId>("math");
  const [chapter, setChapter] = useState("");
  const [question, setQuestion] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (json.success) setImagePath(json.data);
    setUploading(false);
  }

  async function handleSubmit() {
    if (!question.trim()) return;
    setSaving(true);
    const q: Question = {
      id: crypto.randomUUID(),
      subject,
      chapter: chapter || undefined,
      question: question.trim(),
      imagePath: imagePath || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await fetch("/api/qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setQuestion("");
      setChapter("");
      setImagePath("");
    }, 1500);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 transition-colors flex items-center justify-center text-lg z-40"
        title="提问"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-800">学习中遇到什么问题？</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">✕</button>
            </div>

            {done ? (
              <div className="text-center py-8 text-green-600 text-sm">已保存，我会在下次对话中回答你</div>
            ) : (
              <>
                <div className="flex gap-2">
                  <select
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value as SubjectId); setChapter(""); }}
                    className="text-xs px-2 py-2 border border-zinc-200 rounded-lg"
                  >
                    {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="text-xs px-2 py-2 border border-zinc-200 rounded-lg flex-1"
                  >
                    <option value="">不指定章节</option>
                    {CHAPTERS[subject].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="写下你的问题..."
                  rows={4}
                  className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
                  autoFocus
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 disabled:opacity-50"
                  >
                    {uploading ? "上传中..." : imagePath ? "更换图片" : "📎 添加图片"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                  {imagePath && (
                    <span className="text-xs text-green-600">✓ 已上传</span>
                  )}
                </div>

                {imagePath && (
                  <img src={imagePath} alt="问题截图" className="w-full rounded-lg border border-zinc-200 max-h-48 object-contain bg-zinc-50" />
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || saving}
                  className="w-full py-2.5 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {saving ? "保存中..." : "提交问题"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
