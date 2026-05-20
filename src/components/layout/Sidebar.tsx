"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: "□" },
  { href: "/daily", label: "每日规划", icon: "○" },
  { href: "/progress", label: "章节进度", icon: "▣" },
  { href: "/plan", label: "备考计划", icon: "◎" },
  { href: "/stats", label: "学习统计", icon: "◉" },
  { href: "/mistakes", label: "错题本", icon: "×" },
  { href: "/qa", label: "随学随问", icon: "?" },
  { href: "/info", label: "信息收集", icon: "⊕" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 text-zinc-300 flex flex-col min-h-full">
      <div className="px-5 py-6 border-b border-zinc-800">
        <h1 className="text-white text-lg font-bold tracking-tight">考研备考</h1>
        <p className="text-zinc-500 text-xs mt-1">电子科技大学 · 计算机学硕</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-zinc-800 text-white font-medium"
                  : "hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-zinc-800 space-y-2">
        <a
          href="/api/export"
          className="block text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          导出备份 ↓
        </a>
        <div className="text-xs text-zinc-600">
          倒计时 · 2026.12.20
        </div>
      </div>
    </aside>
  );
}
