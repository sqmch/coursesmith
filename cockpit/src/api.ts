/** Optional per-module math-lab config (curriculum/NN/lab.json). See LAB.md. */
export interface VectorLabConfig {
  axisX?: string;
  axisY?: string;
  a?: { role?: string; text?: string; v?: [number, number] };
  b?: { role?: string; text?: string; v?: [number, number] };
  presets?: { label: string; a: [number, number]; b: [number, number]; aText?: string; bText?: string }[];
}
/** Config for the Chunking & Overlap lab — words stand in for tokens. */
export interface ChunkingLabConfig {
  /** The document to chunk (whitespace-split; each word is a token stand-in). */
  text?: string;
  /** Initial chunk size, in tokens. */
  size?: number;
  /** Initial overlap, in tokens. */
  overlap?: number;
  /** Half-open token range [start, end) of a "fact" to track across boundaries. */
  factSpan?: [number, number];
  /** Human label for the tracked fact, e.g. "runs on port 5173". */
  factLabel?: string;
  presets?: { label: string; size: number; overlap: number }[];
}
export interface ModuleLabConfig {
  /** What the learner is currently wrestling with — shown as a callout in the lab. */
  focus?: string;
  /**
   * Registry id of the lab the `focus` text is written for. When several labs
   * claim the current module, this picks which one shows the callout and which
   * one the overlay opens to. Absent → the first live lab for the module.
   */
  focusLab?: string;
  vectors?: VectorLabConfig;
  chunking?: ChunkingLabConfig;
}

export interface ModuleInfo {
  id: string;
  title: string;
  phase: number;
  prerequisites: string[];
  runtime: string;
  estimatedHours: number;
  bossCheck?: boolean;
  status: "not-started" | "in-progress" | "complete" | string;
  hintsUsed: string[];
  checkAttempts: number;
  docs: string[];
  lab?: ModuleLabConfig | null;
}

export interface Course {
  repoRoot: string;
  currentModule: string | null;
  learner: { profile?: string } | null;
  modules: ModuleInfo[];
}

export async function fetchCourse(): Promise<Course> {
  const res = await fetch("/api/course");
  if (!res.ok) throw new Error(`course fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchFile(path: string): Promise<string> {
  const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return data.content as string;
}

export const PHASE_NAMES: Record<number, string> = {
  0: "Orientation",
  1: "Retrieval — RAG",
  2: "Agents & Harnesses",
  3: "Eval Harnesses",
  4: "Capstone",
};
