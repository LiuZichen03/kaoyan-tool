import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // directory exists
  }
}

export async function readJson<T>(relativePath: string): Promise<T | null> {
  const filePath = path.join(DATA_DIR, relativePath);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(relativePath: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, relativePath);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readMarkdown(relativePath: string): Promise<string | null> {
  const filePath = path.join(DATA_DIR, relativePath);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function writeMarkdown(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(DATA_DIR, relativePath);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function listJsonFiles(dirPath: string): Promise<string[]> {
  const fullPath = path.join(DATA_DIR, dirPath);
  try {
    const files = await fs.readdir(fullPath);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

export async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  const fullPath = path.join(DATA_DIR, dirPath);
  try {
    const files = await fs.readdir(fullPath);
    return files.filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

export async function deleteFile(relativePath: string): Promise<void> {
  const filePath = path.join(DATA_DIR, relativePath);
  try {
    await fs.unlink(filePath);
  } catch {
    // file doesn't exist
  }
}
