// Pure helpers for the state overlay — data → data, no React, no I/O.
//
// Quiz due-ness mirrors scripts/quiz.mjs exactly (read, not imported, per the
// engine/instance split): whole calendar days computed in UTC so DST never
// shifts a boundary, an item is due when today >= due, and the due queue is
// sorted most-overdue-first with id as the tiebreak. Keep these in step with
// that script if its arithmetic ever changes.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date as YYYY-MM-DD — the "today" quiz.mjs grades against. */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function validIso(s: unknown): s is string {
  if (typeof s !== "string" || !ISO.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Whole days from `fromIso` to `toIso` (positive when `toIso` is later). */
export function daysBetween(fromIso: string, toIso: string): number {
  const [ay, am, ad] = fromIso.split("-").map(Number);
  const [by, bm, bd] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

// ── quiz bank ──────────────────────────────────────────────────────────────

export type QuizResult = "correct" | "partial" | "wrong" | "tutored" | "rescheduled" | string;

export interface QuizHistoryEntry {
  date?: string;
  result?: QuizResult;
  note?: string;
}
export interface QuizItem {
  id: string;
  module?: string;
  question?: string;
  interval?: number;
  due?: string;
  history?: QuizHistoryEntry[];
}
export interface QuizBank {
  items: QuizItem[];
}

/** A scheduled item with its distance from today (>= 0 = overdue, < 0 = upcoming). */
export interface DueRow {
  item: QuizItem;
  over: number;
}

export function parseQuizBank(raw: string): QuizBank | null {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.items)) return null;
    return data as QuizBank;
  } catch {
    return null;
  }
}

const byDueThenId = (a: DueRow, b: DueRow): number =>
  a.item.due! < b.item.due!
    ? -1
    : a.item.due! > b.item.due!
      ? 1
      : a.item.id < b.item.id
        ? -1
        : a.item.id > b.item.id
          ? 1
          : 0;

/** Items due as of `today`, most-overdue-first — the quiz.mjs `due` order. */
export function dueItems(bank: QuizBank | null, today: string): DueRow[] {
  if (!bank || !Array.isArray(bank.items)) return [];
  return bank.items
    .filter((it) => it && validIso(it.due))
    .map((it) => ({ item: it, over: daysBetween(it.due as string, today) }))
    .filter((x) => x.over >= 0)
    .sort(byDueThenId);
}

/** Items not yet due, soonest-first — the rest of the retention picture. */
export function scheduledItems(bank: QuizBank | null, today: string): DueRow[] {
  if (!bank || !Array.isArray(bank.items)) return [];
  return bank.items
    .filter((it) => it && validIso(it.due))
    .map((it) => ({ item: it, over: daysBetween(it.due as string, today) }))
    .filter((x) => x.over < 0)
    .sort(byDueThenId);
}

// ── journal ──────────────────────────────────────────────────────────────

export interface JournalEntry {
  /** The heading's leading token(s) before the em dash — a date or date range. */
  date: string;
  title: string;
  /** Markdown body between this heading and the next (separators trimmed). */
  body: string;
}

/** Split the append-only journal on its `## date — title` headings, newest first.
 *  Tolerant: any `## …` heading opens an entry (the `2026-06-15/16` range heading
 *  included); text before the first heading (the file's preamble) is dropped. */
export function parseJournal(raw: string): JournalEntry[] {
  const lines = raw.split(/\r?\n/);
  const entries: JournalEntry[] = [];
  let cur: { heading: string; body: string[] } | null = null;

  const flush = () => {
    if (!cur) return;
    const body = cur.body.slice();
    while (body.length && body[0].trim() === "") body.shift();
    while (
      body.length &&
      (body[body.length - 1].trim() === "" || body[body.length - 1].trim() === "---")
    ) {
      body.pop();
    }
    const { date, title } = splitHeading(cur.heading);
    entries.push({ date, title, body: body.join("\n") });
    cur = null;
  };

  for (const line of lines) {
    const m = /^##(?!#)\s+(.+?)\s*$/.exec(line); // level-2 only (## not ###)
    if (m) {
      flush();
      cur = { heading: m[1], body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  flush();
  entries.reverse();
  return entries;
}

/** "2026-06-10 — Session 1 (…)" → { date, title }; the em/en dash or a spaced
 *  hyphen splits them. Date-internal hyphens (2026-06-10) never match — the
 *  separator must be surrounded by whitespace. */
function splitHeading(heading: string): { date: string; title: string } {
  const m = /^(.*?)\s+[—–-]\s+(.*)$/.exec(heading);
  if (m) return { date: m[1].trim(), title: m[2].trim() };
  return { date: "", title: heading.trim() };
}

// ── progress ──────────────────────────────────────────────────────────────

export interface RawModuleProgress {
  status?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  hintsUsed?: string[];
  checkAttempts?: number;
  notes?: string;
}
export interface ProgressFile {
  learner?: { profile?: string; paceHoursPerWeek?: string; started?: string };
  currentModule?: string | null;
  modules?: Record<string, RawModuleProgress>;
}

export function parseProgress(raw: string): ProgressFile | null {
  try {
    const d = JSON.parse(raw);
    return d && typeof d === "object" ? (d as ProgressFile) : null;
  } catch {
    return null;
  }
}

/** Days a module took (start → completion), or has been open (start → today).
 *  null when it never started. */
export function moduleDuration(
  p: RawModuleProgress,
  today: string,
): { days: number; ongoing: boolean } | null {
  if (!validIso(p.startedAt)) return null;
  const ongoing = !validIso(p.completedAt);
  const end = ongoing ? today : (p.completedAt as string);
  return { days: Math.max(0, daysBetween(p.startedAt as string, end)), ongoing };
}

/** "3-5" / "3–5" / "4" → { lo, hi } target hours-per-week; null if unparseable. */
export function parsePace(s?: string): { lo: number; hi: number } | null {
  if (!s) return null;
  const nums = String(s).match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const lo = Number(nums[0]);
  const hi = Number(nums[nums.length - 1]);
  return Number.isFinite(lo) && Number.isFinite(hi) ? { lo, hi } : null;
}

/** Which of hint-1/2/3 a module has consumed, as a fixed 3-slot boolean row. */
export function hintLevels(hintsUsed: string[] | undefined): boolean[] {
  const used = new Set(hintsUsed ?? []);
  return [1, 2, 3].map((n) => used.has(`hint-${n}`));
}
