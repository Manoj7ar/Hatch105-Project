import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

let cachedWritableRoot: string | undefined;

function canWriteDir(dir: string): boolean {
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const probe = join(dir, `.probe-${process.pid}`);
    writeFileSync(probe, "1");
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

/** Writable directory for jobs, new scores, research (local cwd or /tmp on Vercel). */
export function getWritableRoot(): string {
  if (process.env.HATCH105_WRITABLE_DIR?.trim()) {
    return process.env.HATCH105_WRITABLE_DIR.trim();
  }
  if (cachedWritableRoot) return cachedWritableRoot;

  const cwd = process.cwd();
  if (canWriteDir(cwd)) {
    cachedWritableRoot = cwd;
    return cwd;
  }

  const tmpRoot = join(tmpdir(), "hatch105-data");
  if (!existsSync(tmpRoot)) mkdirSync(tmpRoot, { recursive: true });
  cachedWritableRoot = tmpRoot;
  return tmpRoot;
}

export function isEphemeralWritableRoot(): boolean {
  return getWritableRoot() !== process.cwd();
}
