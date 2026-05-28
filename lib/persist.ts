import { del, get, list, put } from "@vercel/blob";
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

const BLOB_ACCESS = "private" as const;

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

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
      access: BLOB_ACCESS,
      allowOverwrite: true,
      addRandomSuffix: false,
      token: blobToken(),
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

async function readBlobText(pathname: string): Promise<string | null> {
  const result = await get(pathname, {
    access: BLOB_ACCESS,
    token: blobToken(),
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return new Response(result.stream).text();
}

export async function persistGet(relativePath: string): Promise<string | null> {
  if (isBlobPersistenceEnabled()) {
    try {
      const text = await readBlobText(blobPath(relativePath));
      if (text !== null) return text;
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
      await del(blobPath(relativePath), { token: blobToken() });
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
        token: blobToken(),
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
