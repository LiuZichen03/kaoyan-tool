import { NextRequest, NextResponse } from "next/server";
import { readMarkdown, writeMarkdown, listMarkdownFiles, readJson, writeJson } from "@/lib/storage";
import { InfoNote, ApiResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<InfoNote[] | InfoNote>>> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search")?.toLowerCase();

  if (id) {
    const meta = await readJson<Omit<InfoNote, "content">>(`info/${id}.meta.json`);
    if (!meta) return NextResponse.json({ success: false, error: "Not found" });
    const content = await readMarkdown(`info/${id}.md`);
    return NextResponse.json({ success: true, data: { ...meta, content: content || "" } });
  }

  const files = await listMarkdownFiles("info");
  const notes: InfoNote[] = [];

  for (const file of files) {
    const meta = await readJson<Omit<InfoNote, "content">>(`info/${file.replace(".md", ".meta.json")}`);
    if (meta) {
      if (tag && !meta.tags.includes(tag)) continue;
      if (search && !meta.title.toLowerCase().includes(search) && !meta.tags.some((t) => t.includes(search))) continue;
      notes.push({ ...meta, content: "" });
    }
  }

  notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({ success: true, data: notes });
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<InfoNote>>> {
  const note: InfoNote = await request.json();
  const slug = note.id || note.title.replace(/[^a-zA-Z0-9一-鿿]/g, "-").toLowerCase();

  await writeMarkdown(`info/${slug}.md`, note.content);

  const meta = {
    id: slug,
    title: note.title,
    tags: note.tags,
    source: note.source,
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeJson(`info/${slug}.meta.json`, meta);

  return NextResponse.json({ success: true, data: { ...meta, content: note.content } });
}
