"use client";

import { useState, useEffect, useCallback } from "react";
import { InfoNote } from "@/lib/types";

type Tab = "list" | "edit";

export default function InfoPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [notes, setNotes] = useState<InfoNote[]>([]);
  const [editing, setEditing] = useState<InfoNote | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tagFilter) params.set("tag", tagFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/info?${params}`);
    const json = await res.json();
    setNotes(json.data || []);
    setLoading(false);
  }, [search, tagFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  async function saveNote(note: InfoNote) {
    await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    await fetchNotes();
    setEditing(null);
    setTab("list");
  }

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">信息收集</h2>
        <button
          onClick={() => { setEditing(null); setTab("edit"); }}
          className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
        >
          新建笔记
        </button>
      </header>

      <div className="p-8 max-w-4xl mx-auto">
        {tab === "list" && (
          <>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索标题或标签..."
                className="flex-1 text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button
                  onClick={() => setTagFilter("")}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    !tagFilter ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tag === tagFilter ? "" : tag)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      tagFilter === tag ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <p className="text-zinc-400 text-sm">加载中...</p>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-sm">
                还没有笔记，点击右上角按钮开始收集信息
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => { setEditing(note); setTab("edit"); }}
                    className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-zinc-800">{note.title}</h3>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {note.tags.map((t) => (
                          <span key={t} className="text-[10px] text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                    {note.source && (
                      <p className="text-[10px] text-zinc-400 truncate">
                        来源: {note.source}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "edit" && (
          <InfoEditor
            initial={editing}
            onSave={saveNote}
            onCancel={() => { setEditing(null); setTab("list"); }}
          />
        )}
      </div>
    </div>
  );
}

function InfoEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: InfoNote | null;
  onSave: (note: InfoNote) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial ? "" : "");
  const [contentLoaded, setContentLoaded] = useState(false);
  const [tags, setTags] = useState(initial?.tags?.join(", ") || "");
  const [source, setSource] = useState(initial?.source || "");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (initial && !contentLoaded) {
      fetch(`/api/info?id=${initial.id}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.data) setContent(j.data.content);
        })
        .catch(() => {});
      setContentLoaded(true);
    }
  }, [initial, contentLoaded]);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: initial?.id || "",
      title: title.trim(),
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      source: source.trim() || undefined,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
      <h3 className="font-semibold text-zinc-800">{initial ? "编辑笔记" : "新建笔记"}</h3>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题"
        className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200"
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">标签（逗号分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：招生简章, 考试大纲, 备考资料"
            className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">来源链接（可选）</label>
          <input
            type="url"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="https://..."
            className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-zinc-500">内容（Markdown）</label>
          <button
            onClick={() => setPreview(!preview)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {preview ? "编辑" : "预览"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[200px] p-4 bg-zinc-50 rounded-lg text-sm text-zinc-700 whitespace-pre-wrap font-mono">
            {content || "（空内容）"}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持 Markdown 格式..."
            rows={12}
            className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none font-mono"
          />
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="text-xs px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-lg">取消</button>
        <button onClick={handleSave} disabled={!title.trim()} className="text-xs px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50">
          {initial ? "更新" : "保存"}
        </button>
      </div>
    </div>
  );
}
