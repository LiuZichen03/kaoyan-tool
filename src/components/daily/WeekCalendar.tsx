"use client";

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export default function WeekCalendar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (date: string) => void;
}) {
  const dates = getWeekDates(selected);

  return (
    <div className="flex items-center gap-1">
      {dates.map(({ date, label }) => {
        const isSelected = date === selected;
        const isToday = date === new Date().toISOString().split("T")[0];
        return (
          <button
            key={date}
            onClick={() => onSelect(date)}
            className={`flex flex-col items-center w-11 py-2 rounded-lg text-xs transition-colors ${
              isSelected
                ? "bg-zinc-900 text-white"
                : isToday
                ? "bg-zinc-100 text-zinc-900 font-semibold"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            <span className="text-[10px]">{label}</span>
            <span className="text-sm font-medium">{date.split("-")[2]}</span>
          </button>
        );
      })}
    </div>
  );
}

function getWeekDates(center: string): { date: string; label: string }[] {
  const d = new Date(center);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      date: date.toISOString().split("T")[0],
      label: DAY_LABELS[date.getDay()],
    };
  });
}
