import { TodayFocusItem, SubjectId } from "@/lib/types";

const SUBJECT_NAMES: Record<SubjectId, string> = {
  politics: "政治", english: "英语", math: "数学", cs: "专业课",
};

const SUBJECT_DOT: Record<SubjectId, string> = {
  math: "bg-amber-500", cs: "bg-emerald-500", english: "bg-blue-500", politics: "bg-red-500",
};

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export default function TodayFocus({ items }: { items: TodayFocusItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-zinc-50">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${SUBJECT_DOT[item.subject]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-zinc-400">{SUBJECT_NAMES[item.subject]}</span>
              <span className="text-[10px] text-zinc-400">{item.reason}</span>
            </div>
            <p className="text-sm text-zinc-800 font-medium">{item.chapter}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-amber-500">{stars(item.weight)}</div>
            <div className="text-[10px] text-zinc-400">{item.suggestedTime}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
