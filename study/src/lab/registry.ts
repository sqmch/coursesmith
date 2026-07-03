import type { ComponentType } from "react";
import type { ModuleLabConfig } from "../api";
import { VectorSimilarityLab } from "./labs/VectorSimilarityLab";
import { ChunkingOverlapLab } from "./labs/ChunkingOverlapLab";

/** Props every lab component receives from the overlay. */
export interface LabProps {
  config?: ModuleLabConfig | null;
  moduleId?: string | null;
}

// ── the extensibility seam ───────────────────────────────────────────────
//
// A "lab" is one interactive visualization. To add another (see LAB.md):
//   1. drop a component in ./labs/
//   2. add an entry below with the curriculum module ids it illuminates
//   3. that's it — the overlay lists it, and auto-surfaces it as the
//      "current topic" whenever the learner is on one of those modules.
//
// `modules` is the tie-in to the course spine: it maps a visualization to the
// curriculum module(s) whose concepts it makes tangible. Planned labs carry no
// component yet and render a placeholder, so the roadmap is visible in-app.

export interface LabDef {
  id: string;
  /** Short human title shown in the rail and header. */
  title: string;
  /** One-line description of what you'll feel by playing with it. */
  blurb: string;
  /** Curriculum module ids this lab illuminates (drives current-topic badging). */
  modules: string[];
  /** "live" labs render their component; "planned" labs render a placeholder. */
  status: "live" | "planned";
  /** Present only for live labs. */
  component?: ComponentType<LabProps>;
}

export const LABS: LabDef[] = [
  {
    id: "vectors",
    title: "Vectors & Similarity",
    blurb: "Drag two arrows. Feel dot product, length, cosine, and distance move.",
    modules: ["01-embeddings", "02-vector-store"],
    status: "live",
    component: VectorSimilarityLab,
  },
  {
    id: "chunking",
    title: "Chunking & Overlap",
    blurb: "Why long text gets split, and what overlapping windows buy you.",
    modules: ["02-vector-store"],
    status: "live",
    component: ChunkingOverlapLab,
  },
  // ── roadmap (frames in place; components plug in per module) ──────────────
  {
    id: "topk",
    title: "Top-k Retrieval",
    blurb: "Fire a query at a little corpus; watch its nearest neighbours light up.",
    modules: ["03-rag-pipeline"],
    status: "planned",
  },
  {
    id: "eval-metrics",
    title: "Precision & Recall",
    blurb: "Slide the cutoff; see hits, misses, and false alarms trade off.",
    modules: ["04-rag-quality"],
    status: "planned",
  },
];

/** Pick the lab to open first: the one tied to the learner's current module. */
export function defaultLabId(currentModule: string | null): string {
  if (currentModule) {
    const tied = LABS.find((l) => l.status === "live" && l.modules.includes(currentModule));
    if (tied) return tied.id;
  }
  return LABS.find((l) => l.status === "live")?.id ?? LABS[0].id;
}
