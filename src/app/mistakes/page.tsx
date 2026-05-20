"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mistake, SubjectId, SubjectConfig, QuestionType, ReviewResult, WrongTag } from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";
import { isDueForReview, addReviewRecord } from "@/lib/spaced-rep";

const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: "politics", name: "政治" },
  { id: "english", name: "英语" },
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
];

const WRONG_TAGS: WrongTag[] = [
  "概念混淆", "计算失误", "审题偏差", "遗漏条件", "方法错误", "时间不足", "完全不会",
];

const QUESTION_TYPES: QuestionType[] = ["选择题", "填空题", "简答题", "编程题"];

type Tab = "list" | "add" | "review";

export default function MistakesPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [filterSubject, setFilterSubject] = useState<SubjectId | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Mistake | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/mistakes");
    const json = await res.json();
    setMistakes(json.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMistakes(); }, [fetchMistakes]);

  async function save(mistake: Mistake) {
    await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mistake),
    });
    await fetchMistakes();
    setEditing(null);
    setTab("list");
  }

  const filtered = mistakes.filter((m) => {
    if (filterSubject !== "all" && m.subject !== filterSubject) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.source?.toLowerCase().includes(q) && !m.tags.some((t) => t.includes(q)) && !m.wrongTag?.includes(q) && !m.chapter.includes(q)) return false;
    }
    return true;
  });

  const reviewQueue = mistakes.filter(isDueForReview);

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">错题本</h2>
        <div className="flex bg-zinc-100 rounded-lg p-0.5">
          {([
            ["list", "全部"],
            ["add", "添加"],
            ["review", `待复习${reviewQueue.length > 0 ? ` (${reviewQueue.length})` : ""}`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                tab === t ? "bg-white text-zinc-900 shadow-sm font-medium" : "text-zinc-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto">
        {tab === "list" && <MistakeListTab filtered={filtered} mistakes={mistakes} loading={loading} filterSubject={filterSubject} search={search} setFilterSubject={setFilterSubject} setSearch={setSearch} setEditing={setEditing} setTab={setTab} />}
        {tab === "add" && <MistakeForm initial={editing} onSave={save} onCancel={() => { setEditing(null); setTab("list"); }} />}
        {tab === "review" && <ReviewTab queue={reviewQueue} onReviewed={save} />}
      </div>
    </div>
  );
}

function MistakeListTab({
  filtered, mistakes, loading, filterSubject, search, setFilterSubject, setSearch, setEditing, setTab,
}: {
  filtered: Mistake[]; mistakes: Mistake[]; loading: boolean;
  filterSubject: SubjectId | "all"; search: string;
  setFilterSubject: (v: SubjectId | "all") => void; setSearch: (v: string) => void;
  setEditing: (m: Mistake) => void; setTab: (t: Tab) => void;
}) {
  return (
    <>
      <div className="flex gap-3 mb-4">
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value as SubjectId | "all")} className="text-xs px-3 py-2 border border-zinc-200 rounded-lg">
          <option value="all">全部科目</option>
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索来源、标签或错因..." className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200" />
      </div>

      {loading ? <p className="text-zinc-400 text-sm">加载中...</p> : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">
          {mistakes.length === 0 ? "还没有错题，去添加第一道吧" : "无匹配结果"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <button key={m.id} onClick={() => { setEditing(m); setTab("add"); }} className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <SubjectBadge id={m.subject} />
                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{m.type}</span>
                <span className="text-[10px] text-zinc-400">{m.chapter}</span>
                {m.wrongTag && <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{m.wrongTag}</span>}
                {isDueForReview(m) && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">待复习</span>}
              </div>
              <p className="text-sm text-zinc-800 line-clamp-1">{m.source || "未标注来源"}</p>
              {m.wrongNote && <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{m.wrongNote}</p>}
              <div className="flex gap-1 mt-2">
                {m.tags.map((t) => <span key={t} className="text-[10px] text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">{t}</span>)}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function SubjectBadge({ id }: { id: SubjectId }) {
  const colors: Record<SubjectId, string> = {
    politics: "bg-red-100 text-red-700",
    english: "bg-blue-100 text-blue-700",
    math: "bg-amber-100 text-amber-700",
    cs: "bg-emerald-100 text-emerald-700",
  };
  const labels: Record<SubjectId, string> = {
    politics: "政治", english: "英语", math: "数学", cs: "专业课",
  };
  return <span className={`text-xs px-1.5 py-0.5 rounded ${colors[id]}`}>{labels[id]}</span>;
}

function ReviewTab({ queue, onReviewed }: { queue: Mistake[]; onReviewed: (m: Mistake) => void }) {
  if (queue.length === 0) {
    return <div className="text-center py-12 text-zinc-400 text-sm">暂无待复习错题</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">共 {queue.length} 道错题待复习</p>
      {queue.map((m) => (
        <div key={m.id} className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <SubjectBadge id={m.subject} />
            <span className="text-xs text-zinc-400">{m.chapter} · {m.type}</span>
            {m.wrongTag && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">{m.wrongTag}</span>}
          </div>
          {m.imagePath && (
            <img src={m.imagePath} alt="错题照片" className="w-full rounded-lg mb-3 border border-zinc-200 max-h-96 object-contain bg-zinc-50" />
          )}
          <p className="text-sm text-zinc-800 mb-1 font-medium">{m.source}</p>
          {m.wrongNote && <p className="text-xs text-zinc-500 mb-3">{m.wrongNote}</p>}
          {m.question && (
            <details className="mb-3"><summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">题目全文</summary><p className="text-sm text-zinc-700 mt-2 p-3 bg-zinc-50 rounded-lg whitespace-pre-wrap">{m.question}</p></details>
          )}
          {m.answer && (
            <details className="mb-4"><summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-700">查看答案</summary><p className="text-sm text-zinc-700 mt-2 p-3 bg-zinc-50 rounded-lg whitespace-pre-wrap">{m.answer}</p></details>
          )}
          <div className="flex gap-2">
            <button onClick={() => onReviewed(addReviewRecord(m, "still_wrong"))} className="text-xs px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">仍未掌握</button>
            <button onClick={() => onReviewed(addReviewRecord(m, "mastered"))} className="text-xs px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">已掌握</button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">复习 {m.reviewHistory.length} 次 · {m.reviewHistory.filter((r) => r.result === "mastered").length} 次掌握</p>
        </div>
      ))}
    </div>
  );
}

function MistakeForm({ initial, onSave, onCancel }: { initial: Mistake | null; onSave: (m: Mistake) => void; onCancel: () => void }) {
  const [subject, setSubject] = useState<SubjectId>(initial?.subject || "math");
  const [chapter, setChapter] = useState(initial?.chapter || CHAPTERS.math[0]);
  const [type, setType] = useState<QuestionType>(initial?.type || "选择题");
  const [source, setSource] = useState(initial?.source || "");
  const [wrongTag, setWrongTag] = useState<WrongTag | "">(initial?.wrongTag || "");
  const [wrongNote, setWrongNote] = useState(initial?.wrongNote || "");
  const [imagePath, setImagePath] = useState(initial?.imagePath || "");
  const [tags, setTags] = useState(initial?.tags?.join(", ") || "");
  const [uploading, setUploading] = useState(false);
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

  function handleSave() {
    if (!source.trim()) return;
    onSave({
      id: initial?.id || crypto.randomUUID(),
      subject,
      chapter,
      type,
      source: source.trim(),
      wrongTag: wrongTag || "",
      wrongNote,
      imagePath,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: initial?.createdAt || new Date().toISOString(),
      reviewHistory: initial?.reviewHistory || [],
      question: initial?.question,
      answer: initial?.answer,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
      <h3 className="font-semibold text-zinc-800">{initial ? "编辑错题" : "添加错题 — 纸质友好录入"}</h3>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">科目</label>
          <select value={subject} onChange={(e) => { setSubject(e.target.value as SubjectId); setChapter(CHAPTERS[e.target.value as SubjectId][0]); }} className="w-full text-xs px-2 py-2 border border-zinc-200 rounded-lg">
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">章节</label>
          <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full text-xs px-2 py-2 border border-zinc-200 rounded-lg">
            {CHAPTERS[subject].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">题型</label>
          <select value={type} onChange={(e) => setType(e.target.value as QuestionType)} className="w-full text-xs px-2 py-2 border border-zinc-200 rounded-lg">
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">📖 来源定位</label>
          <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="《30讲》P32 例2.4" className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">📎 照片</label>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs px-3 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600 disabled:opacity-50">
              {uploading ? "上传中..." : imagePath ? "更换照片" : "拍照/上传"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            {imagePath && <span className="text-xs text-green-600 self-center">✓</span>}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-2">❌ 错误原因</label>
        <div className="flex flex-wrap gap-1.5">
          {WRONG_TAGS.map((t) => (
            <button key={t} onClick={() => setWrongTag(t === wrongTag ? "" : t)} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${wrongTag === t ? "bg-red-50 border-red-300 text-red-700 font-medium" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <input type="text" value={wrongNote} onChange={(e) => setWrongNote(e.target.value)} placeholder="补充备注（可选）：具体哪里想错了？" className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200" />

      <div>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="标签（逗号分隔）：高频考点, 易错" className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="text-xs px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-lg">取消</button>
        <button onClick={handleSave} disabled={!source.trim()} className="text-xs px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50">{initial ? "更新" : "保存"}</button>
      </div>
    </div>
  );
}
