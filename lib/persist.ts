import { del, head, list, put } from "@vercel/blob";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { getWritableRoot } from "./writable-root";

const BLOB_PREFIX = "hatch105/";

export function isBlobPersistenceEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobPath(relativePath: string): string {
  return `${BLOB_PREFIX}${relativePath.replace(/^\/+/, "")}`;
}

function fsPath(relativePath: string): string {
  return join(getWritableRoot(), relativePath);
}

export async function persistPut(
  relativePath: string,
  content: string
): Promise<void> {
  if (isBlobPersistenceEnabled()) {
    await put(blobPath(relativePath), content, {
      access: "public",
      allowOverwrite: true,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }

  const path = fsPath(relativePath);
  try {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(path, content);
  } catch {
    /* read-only bundle */
  }
}

export async function persistGet(relativePath: string): Promise<string | null> {
  if (isBlobPersistenceEnabled()) {
    try {
      const meta = await head(blobPath(relativePath), {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (!meta?.url) return null;
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      /* fall through to fs */
    }
  }

  const path = fsPath(relativePath);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

export async function persistDelete(relativePath: string): Promise<void> {
  if (isBlobPersistenceEnabled()) {
    try {
      const meta = await head(blobPath(relativePath), {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (meta?.url) {
        await del(meta.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
    } catch {
      /* ignore */
    }
  }

  const path = fsPath(relativePath);
  if (!existsSync(path)) return;
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

export async function persistList(relativeDir: string): Promise<string[]> {
  const normalized = relativeDir.replace(/^\/+|\/+$/g, "");
  const paths: string[] = [];

  if (isBlobPersistenceEnabled()) {
    const prefix = normalized ? `${BLOB_PREFIX}${normalized}/` : BLOB_PREFIX;
    let cursor: string | undefined;
    do {
      const page = await list({
        prefix,
        cursor,
        limit: 1000,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      for (const blob of page.blobs) {
        const stripped = blob.pathname.replace(BLOB_PREFIX, "");
        paths.push(stripped);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }

  const dir = fsPath(normalized);
  if (existsSync(dir)) {
    try {
      for (const f of readdirSync(dir)) {
        if (!f.endsWith(".json")) continue;
        const rel = normalized ? `${normalized}/${f}` : f;
        if (!paths.includes(rel)) paths.push(rel);
      }
    } catch {
      /* ignore */
    }
  }

  return paths;
}

export function persistListSync(relativeDir: string): string[] {
  const normalized = relativeDir.replace(/^\/+|\/+$/g, "");
  const dir = fsPath(normalized);
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => (normalized ? `${normalized}/${f}` : f));
  } catch {
    return [];
  }
}
