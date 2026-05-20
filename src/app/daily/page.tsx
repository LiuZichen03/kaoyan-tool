"use client";

import { useState, useEffect, useCallback } from "react";
import { DailyPlan, Task, SubjectId, TaskSubject, SubjectConfig, Mistake } from "@/lib/types";
import { CHAPTERS } from "@/lib/chapters";
import { todayLocal } from "@/lib/countdown";
import WeekCalendar from "@/components/daily/WeekCalendar";
import StudyTimer from "@/components/daily/StudyTimer";
import CompactTimer from "@/components/daily/CompactTimer";
import AskButton from "@/components/daily/AskButton";

const SUBJECTS: { id: TaskSubject; name: string }[] = [
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
  { id: "english", name: "英语" },
  { id: "politics", name: "政治" },
  { id: "other", name: "杂事" },
];

const TIME_SLOTS = [
  "08:00-10:00", "10:00-12:00", "14:00-16:00",
  "16:00-18:00", "19:00-21:00", "21:00-23:00",
];

function newTask(subject: TaskSubject = "math"): Task {
  return {
    id: crypto.randomUUID(),
    subject,
    title: "",
    timeSlot: "08:00-10:00",
    completed: false,
  };
}

export default function DailyPage() {
  const today = todayLocal();
  const [selectedDate, setSelectedDate] = useState(today);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [todayMistakes, setTodayMistakes] = useState<number>(0);

  const fetchPlan = useCallback(async (date: string) => {
    setLoading(true);
    const res = await fetch(`/api/daily?date=${date}`);
    const json = await res.json();
    setPlan(json.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlan(selectedDate);
    fetch(`/api/mistakes?date=${selectedDate}`).then(r => r.json()).then(j => {
      setTodayMistakes(j.data?.length || 0);
    }).catch(() => {});
  }, [selectedDate, fetchPlan]);

  async function save(updated: DailyPlan) {
    await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setPlan(updated);
  }

  function addTask() {
    if (!plan) return;
    const updated = { ...plan, tasks: [...plan.tasks, newTask()] };
    setPlan(updated);
    setEditingId(updated.tasks[updated.tasks.length - 1].id);
  }

  async function generateFromBriefing() {
    if (!plan) return;
    const res = await fetch("/api/briefing");
    const json = await res.json();
    const focus = json.data?.todayFocus || [];
    if (focus.length === 0) {
      addTask();
      return;
    }
    const slots = ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"];
    const tasks: Task[] = focus.map((item: { subject: SubjectId; chapter: string; suggestedTime: string }, i: number) => ({
      id: crypto.randomUUID(),
      subject: item.subject,
      title: item.chapter,
      chapter: item.chapter,
      timeSlot: slots[i] || "19:00-21:00",
      completed: false,
    }));
    save({ ...plan, tasks });
  }

  function updateTask(taskId: string, updates: Partial<Task>) {
    if (!plan) return;
    const tasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    save({ ...plan, tasks });
  }

  function deleteTask(taskId: string) {
    if (!plan) return;
    const tasks = plan.tasks.filter((t) => t.id !== taskId);
    save({ ...plan, tasks });
    if (editingId === taskId) setEditingId(null);
  }

  function toggleComplete(taskId: string) {
    if (!plan) return;
    const task = plan.tasks.find((t) => t.id === taskId);
    if (task) updateTask(taskId, { completed: !task.completed });
  }

  const completed = plan?.tasks.filter((t) => t.completed).length || 0;
  const total = plan?.tasks.length || 0;
  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

  const timeSpent = plan?.timeSpent || { politics: 0, english: 0, math: 0, cs: 0 };

  function addTimerTime(subject: SubjectId, hours: number) {
    if (!plan) return;
    const newTime = Math.round(((timeSpent[subject] || 0) + hours) * 10) / 10;
    save({ ...plan, timeSpent: { ...timeSpent, [subject]: newTime } });
  }

  return (
    <div>
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
        <h2 className="text-xl font-bold text-zinc-900">每日规划</h2>
        <WeekCalendar selected={selectedDate} onSelect={setSelectedDate} />
      </header>

      {plan && <CompactTimer timeSpent={timeSpent} onTimeAdd={addTimerTime} />}

      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: tasks */}
          <div className="lg:col-span-2">
            {completion > 0 && (
              <div className="mb-6 bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">今日完成</span>
                  <span className="font-semibold text-zinc-900">{completed}/{total} · {completion}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-zinc-800 h-1.5 rounded-full transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-zinc-400 text-sm">加载中...</p>
            ) : (
              <div className="space-y-2">
                {plan?.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isEditing={editingId === task.id}
                    onEdit={() => setEditingId(task.id)}
                    onSave={(updates) => { updateTask(task.id, updates); setEditingId(null); }}
                    onDelete={() => deleteTask(task.id)}
                    onToggle={() => toggleComplete(task.id)}
                  />
                ))}
                {plan?.tasks.length === 0 && (
                  <div className="py-8 text-center space-y-4">
                    <p className="text-zinc-400 text-sm">暂无任务</p>
                    <button
                      onClick={generateFromBriefing}
                      className="px-6 py-3 rounded-xl bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
                    >
                      📋 从今日建议生成任务
                    </button>
                    <p className="text-xs text-zinc-400">或下方手动添加</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={addTask}
              className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 text-sm hover:border-zinc-400 hover:text-zinc-600 transition-colors"
            >
              + 添加任务
            </button>
          </div>

          {/* Right: timer + review */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {plan && (
                <DailyReview
                  plan={plan}
                  todayMistakes={todayMistakes}
                  onSave={(updates) => save({ ...plan, ...updates })}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <AskButton />
    </div>
  );
}

const SUBJECT_TIME_LABELS: Record<TaskSubject, string> = {
  politics: "政治",
  english: "英语",
  math: "数学",
  cs: "专业课",
  other: "杂事",
};

function DailyReview({
  plan,
  todayMistakes,
  onSave,
}: {
  plan: DailyPlan;
  todayMistakes: number;
  onSave: (updates: Partial<DailyPlan>) => void;
}) {
  const timeSpent = plan.timeSpent || { politics: 0, english: 0, math: 0, cs: 0 };
  const [reflection, setReflection] = useState(plan.reflection || "");

  function addTime(subject: SubjectId, hours: number) {
    const newTime = Math.round((timeSpent[subject] + hours) * 10) / 10;
    onSave({
      timeSpent: { ...timeSpent, [subject]: newTime },
      reflection,
    });
  }

  function setTime(subject: SubjectId, val: number) {
    onSave({
      timeSpent: { ...timeSpent, [subject]: val },
      reflection,
    });
  }

  function saveReflection() {
    onSave({ timeSpent, reflection });
  }

  const totalTime = Object.values(timeSpent).reduce((a, b) => a + b, 0);
  const completed = plan.tasks.filter((t) => t.completed).length;
  const total = plan.tasks.length;

  return (
    <div className="mt-8 bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="font-semibold text-zinc-800 mb-4">今日回顾</h3>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-zinc-50 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">任务完成</div>
          <div className="text-2xl font-bold text-zinc-900">
            {total > 0 ? Math.round((completed / total) * 100) : 0}%
          </div>
          <div className="text-xs text-zinc-400 mt-1">{completed}/{total} 项</div>
        </div>
        <div className="bg-zinc-50 rounded-lg p-4">
          <div className="text-xs text-zinc-500 mb-1">今日错题</div>
          <div className="text-2xl font-bold text-zinc-900">{todayMistakes}</div>
          <div className="text-xs text-zinc-400 mt-1">道新录入</div>
        </div>
      </div>

      <div className="mb-5">
        <StudyTimer timeSpent={timeSpent} onTimeAdd={addTime} />
      </div>

      <div className="mb-5">
        <div className="text-xs text-zinc-500 mb-2">手动修正（小时）</div>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(SUBJECT_TIME_LABELS) as SubjectId[]).map((s) => (
            <div key={s} className="text-center">
              <span className="text-[10px] text-zinc-400">{SUBJECT_TIME_LABELS[s]}</span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={timeSpent[s] || ""}
                onChange={(e) => setTime(s, parseFloat(e.target.value) || 0)}
                className="w-full text-center text-sm mt-1 px-1 py-1.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-zinc-500 mb-2">今日反思</div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onBlur={saveReflection}
          placeholder="今天哪里学得好？哪里需要改进？明天怎么调整？"
          rows={4}
          className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none"
        />
      </div>

      <button
        onClick={saveReflection}
        className="mt-3 w-full py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
      >
        保存回顾
      </button>
    </div>
  );
}

function TaskRow({
  task,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onToggle,
}: {
  task: Task;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [subject, setSubject] = useState(task.subject);
  const [timeSlot, setTimeSlot] = useState(task.timeSlot);
  const [chapter, setChapter] = useState(task.chapter || "");

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="任务标题"
          className="w-full text-sm px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value as SubjectId); setChapter(""); }}
            className="text-xs px-2 py-1.5 border border-zinc-200 rounded-lg"
          >
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {subject !== "other" && (
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="text-xs px-2 py-1.5 border border-zinc-200 rounded-lg flex-1"
            >
              <option value="">（可选章节）</option>
              {CHAPTERS[subject].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="text-xs px-2 py-1.5 border border-zinc-200 rounded-lg"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg"
          >
            删除
          </button>
          <button
            onClick={() => onSave({ title, subject, timeSlot, chapter: chapter || undefined })}
            disabled={!title.trim()}
            className="text-xs px-4 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3 cursor-pointer hover:border-zinc-300 transition-colors ${
        task.completed ? "opacity-50" : ""
      }`}
      onClick={onEdit}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
      >
        {task.completed && <span className="text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.completed ? "line-through text-zinc-400" : "text-zinc-800"}`}>
          {task.title || "未命名任务"}
        </p>
        {task.chapter && (
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{task.chapter}</p>
        )}
      </div>
      <SubjectBadge id={task.subject} />
      <span className="text-xs text-zinc-400">{task.timeSlot}</span>
    </div>
  );
}

function SubjectBadge({ id }: { id: TaskSubject }) {
  const colors: Record<TaskSubject, string> = {
    politics: "bg-red-100 text-red-700",
    english: "bg-blue-100 text-blue-700",
    math: "bg-amber-100 text-amber-700",
    cs: "bg-emerald-100 text-emerald-700",
    other: "bg-zinc-100 text-zinc-600",
  };
  const labels: Record<TaskSubject, string> = {
    politics: "政治",
    english: "英语",
    math: "数学",
    cs: "专业课",
    other: "杂事",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colors[id]}`}>
      {labels[id]}
    </span>
  );
}
