import { NextResponse } from "next/server";
import { readJson, listJsonFiles, readMarkdown } from "@/lib/storage";

export async function GET(): Promise<NextResponse> {
  const dailyDates = await listJsonFiles("daily");
  const daily: Record<string, unknown> = {};
  for (const d of dailyDates.sort()) {
    const plan = await readJson(`daily/${d}.json`);
    if (plan) daily[d] = plan;
  }

  const mistakeFiles = await listJsonFiles("mistakes");
  const mistakes: Record<string, unknown> = {};
  for (const f of mistakeFiles) {
    const data = await readJson(`mistakes/${f}.json`);
    if (data) mistakes[f] = data;
  }

  const configFiles = await listJsonFiles("config");
  const config: Record<string, unknown> = {};
  for (const f of configFiles) {
    const data = await readJson(`config/${f}.json`);
    if (data) config[f] = data;
  }

  let qa = null;
  try {
    qa = await readJson("qa/questions.json");
  } catch { /* no qa yet */ }

  const infoFiles = await listJsonFiles("info");
  const info: Record<string, string> = {};
  for (const f of infoFiles) {
    if (f.endsWith(".md")) {
      const md = await readMarkdown(`info/${f}`);
      if (md) info[f] = md;
    }
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    daily, mistakes, qa, config, info,
  };

  return NextResponse.json(
    { success: true, data: backup },
    {
      headers: {
        "Content-Disposition": `attachment; filename="kaoyan-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    }
  );
}
