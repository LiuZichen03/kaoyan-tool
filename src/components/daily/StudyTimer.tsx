"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SubjectId } from "@/lib/types";

const SUBJECTS: { id: SubjectId; name: string; icon: string }[] = [
  { id: "math", name: "数学", icon: "📐" },
  { id: "cs", name: "专业课", icon: "💻" },
  { id: "english", name: "英语", icon: "🇬🇧" },
  { id: "politics", name: "政治", icon: "📖" },
];

const SUBJECT_DOT: Record<SubjectId, string> = {
  math: "bg-amber-500",
  cs: "bg-emerald-500",
  english: "bg-blue-500",
  politics: "bg-red-500",
};

type TimerState = "idle" | "running" | "paused";

interface Props {
  timeSpent: Record<SubjectId, number>;
  onTimeAdd: (subject: SubjectId, hours: number) => void;
}

export default function StudyTimer({ timeSpent, onTimeAdd }: Props) {
  const [activeSubject, setActiveSubject] = useState<SubjectId>("math");
  const [state, setState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const pausedAccRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    if (startRef.current === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    setElapsed(Date.now() - startRef.current - pausedAccRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (state === "running") {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, tick]);

  function handleStart(subject: SubjectId) {
    setActiveSubject(subject);
    startRef.current = Date.now();
    pausedAccRef.current = 0;
    setElapsed(0);
    setState("running");
  }

  function handlePause() {
    setState("paused");
    pausedAccRef.current += Date.now() - startRef.current - pausedAccRef.current - elapsed;
  }

  function handleResume() {
    setState("running");
  }

  function handleStop() {
    const hours = Math.round((elapsed / 3600000) * 10) / 10;
    if (hours >= 0.1) {
      onTimeAdd(activeSubject, hours);
    }
    startRef.current = 0;
    pausedAccRef.current = 0;
    setElapsed(0);
    setState("idle");
  }

  const totalTime = Object.values(timeSpent).reduce((a, b) => a + b, 0);

  function formatTime(ms: number) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-800">学习计时</h3>
        {totalTime > 0 && (
          <span className="text-xs text-zinc-400">今日累计 {totalTime}h</span>
        )}
      </div>

      {state === "idle" ? (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">选择科目开始计时</p>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStart(s.id)}
                className="px-3 py-3 rounded-xl border text-center transition-colors hover:border-zinc-400 border-zinc-200"
              >
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-xs font-medium text-zinc-700">{s.name}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {timeSpent[s.id]}h
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span
              className={`w-2 h-2 rounded-full ${SUBJECT_DOT[activeSubject]} ${
                state === "running" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-sm text-zinc-600">
              {SUBJECTS.find((s) => s.id === activeSubject)?.name}
            </span>
          </div>

          <div className="text-5xl font-mono font-bold text-zinc-900 mb-6 tracking-tight tabular-nums">
            {formatTime(elapsed)}
          </div>

          <div className="flex items-center justify-center gap-3">
            {state === "running" ? (
              <button
                onClick={handlePause}
                className="px-5 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 text-sm hover:bg-amber-100 transition-colors"
              >
                暂停
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="px-5 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 text-sm hover:bg-emerald-100 transition-colors"
              >
                继续
              </button>
            )}
            <button
              onClick={handleStop}
              className="px-5 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-800 transition-colors"
            >
              结束计时
            </button>
          </div>
        </div>
      )}

      {totalTime > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map((s) => (
              <div key={s.id} className="text-center">
                <div className="text-[10px] text-zinc-400 mb-0.5">{s.name}</div>
                <div className="text-sm font-semibold text-zinc-700">
                  {timeSpent[s.id]}h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
