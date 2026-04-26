/**
 * Version & Changelog – load from /versions/*.md files.
 * Each file: vX.Y.Z.md with optional YAML frontmatter (date) and markdown body.
 * Version is derived from filename; date from frontmatter.
 */

import { readdir, readFile } from "fs/promises";
import path from "path";

export type VersionEntry = {
  version: string;
  date: string;
  body: string;
  /** First ~5 lines of body, for "short changelog" preview */
  shortBody: string;
};

const VERSIONS_DIR = path.join(process.cwd(), "versions");
const SHORT_LINES = 5;

function parseFrontmatterAndBody(raw: string): { date: string; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { date: "", body: raw.trim() };
  }
  const yaml = match[1];
  const body = match[2].trim();
  const dateMatch = yaml.match(/date:\s*["']?([\d-]+)["']?/);
  const date = dateMatch ? dateMatch[1] : "";
  return { date, body };
}

function shortChangelog(body: string, maxLines: number = SHORT_LINES): string {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(0, maxLines).join("\n");
}

/** Extract version from filename e.g. v1.0.0.md -> 1.0.0 */
function versionFromFilename(name: string): string | null {
  const m = name.match(/^v?(\d+\.\d+\.\d+)\.md$/i);
  return m ? m[1] : null;
}

/** Compare semver for sort (newest first) */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va !== vb) return vb - va;
  }
  return 0;
}

/**
 * List all version entries from /versions/*.md, sorted newest first.
 * Safe to call from Server Components; returns empty list if folder missing or on error.
 */
export async function getVersionList(): Promise<VersionEntry[]> {
  try {
    const files = await readdir(VERSIONS_DIR);
    const entries: VersionEntry[] = [];
    for (const file of files) {
      const version = versionFromFilename(file);
      if (!version) continue;
      const filePath = path.join(VERSIONS_DIR, file);
      const raw = await readFile(filePath, "utf-8");
      const { date, body } = parseFrontmatterAndBody(raw);
      entries.push({
        version,
        date,
        body,
        shortBody: shortChangelog(body),
      });
    }
    entries.sort((a, b) => compareVersions(a.version, b.version));
    return entries;
  } catch {
    return [];
  }
}

export type VersionInfo = {
  currentVersion: string;
  currentDate: string;
  currentShortChangelog: string;
  allVersions: VersionEntry[];
};

/**
 * Get current (latest) version and full list for settings Version tab.
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  const all = await getVersionList();
  const latest = all[0];
  if (!latest) {
    return {
      currentVersion: "0.0.0",
      currentDate: "",
      currentShortChangelog: "",
      allVersions: [],
    };
  }
  return {
    currentVersion: latest.version,
    currentDate: latest.date,
    currentShortChangelog: latest.shortBody,
    allVersions: all,
  };
}
