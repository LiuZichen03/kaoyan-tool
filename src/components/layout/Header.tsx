export default function Header({ title }: { title: string }) {
  const today = new Date();
  const days: Record<number, string> = {
    0: "日", 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六",
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-200 bg-white">
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      <span className="text-sm text-zinc-500">
        {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 星期{days[today.getDay()]}
      </span>
    </header>
  );
}
