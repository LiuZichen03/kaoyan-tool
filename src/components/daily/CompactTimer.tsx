"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SubjectId } from "@/lib/types";

const SUBJECTS: { id: SubjectId; name: string }[] = [
  { id: "math", name: "数学" },
  { id: "cs", name: "专业课" },
  { id: "english", name: "英语" },
  { id: "politics", name: "政治" },
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

export default function CompactTimer({ timeSpent, onTimeAdd }: Props) {
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

  function handleStop() {
    const hours = Math.round((elapsed / 3600000) * 10) / 10;
    if (hours >= 0.1) onTimeAdd(activeSubject, hours);
    startRef.current = 0;
    pausedAccRef.current = 0;
    setElapsed(0);
    setState("idle");
  }

  const totalTime = Object.values(timeSpent).reduce((a, b) => a + b, 0);

  function fmt(ms: number) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="bg-white border-b border-zinc-200 px-8 py-3 flex items-center gap-4">
      {state === "idle" ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400 mr-1">计时：</span>
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStart(s.id)}
              className="text-xs px-2.5 py-1 rounded-lg border transition-colors hover:border-zinc-400 border-zinc-200 text-zinc-500"
            >
              {s.name}
              {timeSpent[s.id] > 0 && (
                <span className="ml-1 text-zinc-400">{timeSpent[s.id]}h</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${SUBJECT_DOT[activeSubject]} ${state === "running" ? "animate-pulse" : ""}`} />
          <span className="text-sm font-mono font-medium text-zinc-800 tabular-nums">{fmt(elapsed)}</span>
          <span className="text-xs text-zinc-400">{SUBJECTS.find((s) => s.id === activeSubject)?.name}</span>
          {state === "running" ? (
            <button onClick={handlePause} className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50">暂停</button>
          ) : (
            <button onClick={() => setState("running")} className="text-xs px-2 py-1 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50">继续</button>
          )}
          <button onClick={handleStop} className="text-xs px-2 py-1 rounded bg-zinc-900 text-white hover:bg-zinc-800">结束</button>
        </div>
      )}

      <div className="ml-auto text-xs text-zinc-400">
        今日 <span className="font-medium text-zinc-700">{totalTime}h</span>
      </div>
    </div>
  );
}
