# Math Lab — visual intuition, wired to the course

A small interactive playground inside the cockpit for **feeling** the math the course leans on,
built for a learner who doesn't read notation. Two labs are live — **Vectors & Similarity**
(dot product, magnitude, normalization, cosine, euclidean distance; shipped with `01-embeddings`)
and **Chunking & Overlap** (boundary-straddle, overlap rescue, the duplicated-token cost;
shipped with `02-vector-store`). The frame is deliberately a *registry of labs* so the next
topic that benefits from a picture plugs into the same shell.

Launch: the **`◇ math lab`** button in the cockpit topbar → full-screen overlay → `esc` closes.

## Why this exists

The learner hit the exact rock most people hit here: the word **"length" means two unrelated
things** — number of components (dimensionality, what `a.length` checks) vs. magnitude (how long
the arrow is, `‖A‖`). On paper that collision is invisible; on a draggable 2-D plane it's
obvious — normalize, and every arrow snaps to the same on-screen length while keeping its
direction. The lab makes that one image do the teaching. Notation is optional (a "show the
arithmetic" toggle), numbers and motion are primary.

This is **learning-serving supplementary content**, the kind the tutor "may freely generate"
(`PLATFORM.md` → Tutor layer). It is *not* one of the Phase-3-frozen platform features (quiz UI,
WebContainers, hosted edition, tutor-agent service), and it's exempt from the displacement-trap
guard for the same reason content/architecture work is: it serves the current module directly.

## Design invariants (kept)

- **Owns zero durable state.** All lab state is ephemeral React state. Nothing is written to the
  repo; `progress.json` and the markdown remain the single source of truth. The course works
  identically with the lab closed or deleted.
- **Never disrupts the session.** The overlay renders *on top* of a still-mounted workspace, so
  the PTY terminal and course selection survive open/close untouched.
- **Additive & monochrome.** Reuses the cockpit's `:root` tokens (IBM Plex, grayscale, thin
  lines) — no color, no new dependencies, hand-rolled SVG. Everything lab-specific lives under
  `src/lab/`; the only edits outside it are a topbar button + `.lab-launch` style.

## Anatomy

```
cockpit/src/lab/
  registry.ts                 ← the extensibility seam: LabDef[] + current-topic resolver
  LabOverlay.tsx              ← full-screen shell: lab rail + main pane + esc-to-close
  lab.css                     ← styles, all reusing the cockpit tokens
  vec.ts                      ← 2-D vector helpers (the lab's plumbing — see note below)
  labs/
    VectorSimilarityLab.tsx   ← lab #1 (live)
    ChunkingOverlapLab.tsx    ← lab #2 (live, built with module 02)
```

Wiring into the cockpit (the whole footprint):
- `App.tsx` — a `labOpen` flag, the topbar button, and an always-mounted `<LabOverlay open=…/>`
  (hidden when closed) that's handed the current module's `lab` config.
- `styles.css` — `.topbar-right` flex + `.lab-launch` button.
- `server/index.ts` — reads each module's optional `lab.json` into `module.lab`; also normalizes
  progress status (`"completed"` → `"complete"`) so the rail/meter render correctly.
- `api.ts` — `ModuleLabConfig` / `VectorLabConfig` / `ChunkingLabConfig` types + `module.lab`.

Plus content: `curriculum/NN/lab.json` (tutor-generated, per module).

## The extensibility model

A **lab** is one entry in `LABS` (`registry.ts`):

```ts
interface LabDef {
  id: string;
  title: string;
  blurb: string;          // one line: what you'll feel by playing with it
  modules: string[];      // curriculum module ids this lab illuminates
  status: "live" | "planned";
  component?: ComponentType<LabProps>;  // present for live labs
}
```

**To add a lab:**
1. Drop a component in `src/lab/labs/` (receives `LabProps = { config?, moduleId? }`; reads/writes
   only its own state).
2. Add a `LABS` entry with the `modules` it illuminates and `status: "live"`.
3. Done. The overlay lists it, renders it, and — when the learner's `currentModule` is one of its
   `modules` — badges it **current topic**, opens to it by default, and feeds it that module's
   `lab.json` config.

`status: "planned"` entries need no component; they render a placeholder card ("arrives with
module 0X"), so the roadmap is visible *inside the app*, not just here.

### Two layers of course coupling

**Structural** — `modules: string[]` on each `LabDef`. The overlay gets `currentModule` from the
course API and `defaultLabId()` surfaces the lab tied to where the learner actually is. As they
advance, the lab that opens first advances with them. No extra plumbing.

**Content** — a per-module **`curriculum/NN/lab.json`** (read by the server, delivered as
`module.lab`, passed to the active lab when it matches the current module). This is what makes the
visualization *about the lesson*, not generic, and what the tutor edits mid-session when a
specific confusion surfaces. The lab re-seeds its vectors **only when `moduleId` changes** — so a
window-focus refetch or the learner's own dragging is never clobbered (the overlay also stays
mounted across open/close, preserving state). Display-only fields (axis labels, example texts,
presets, `focus`) reflect the latest `lab.json` on the next course fetch.

```jsonc
// curriculum/NN-name/lab.json
{
  "provenance": "tutor-generated",
  "focus": "one line: the live confusion this module's picture should target",
  "focusLab": "chunking",            // which lab the focus is written for; when several
                                     // labs claim the module, the overlay opens to this one
  "vectors": {                       // config for the "vectors" lab
    "axisX": "topic: account / login",   // human-meaning axis labels
    "axisY": "topic: food / cooking",
    "a": { "role": "query",    "text": "how do I reset my password?", "v": [2.5, 0.5] },
    "b": { "role": "document", "text": "I can't log into my account",  "v": [2.2, 0.75] },
    "presets": [                     // mirror the LESSON's worked examples
      { "label": "near-duplicate", "a": [2.5,0.5], "b": [2.2,0.75],
        "aText": "…", "bText": "…" }
    ]
  },
  "chunking": {                      // config for the "chunking" lab
    "text": "The dev server runs on port 5173 by default in Vite",  // words ≈ tokens
    "size": 5,                       // initial slider values — start at the *failure*
    "overlap": 0,                    // state so the rescue story plays forward
    "factSpan": [3, 7],              // half-open token range of the tracked fact
    "factLabel": "runs on port 5173",
    "presets": [ { "label": "overlap 2 — fact survives", "size": 5, "overlap": 2 } ]
  }
}
```

All fields optional; absent ones fall back to neutral defaults (`x-axis`/`y-axis`, no example
text, the built-in presets and default document). Plane range is ±3, so keep vector components
in that box.

**Generation & adaptation protocol** (enforced in `CLAUDE.md`):
- *At module generation:* if the module has load-bearing math/geometry, derive `lab.json` from the
  LESSON/BRIEF you just wrote — same examples, same vocabulary — so the picture and the prose
  agree. Skip it for modules with no spatial intuition.
- *During sessions:* when a session reveals a *specific* misconception, update `lab.json` — rewrite
  `focus`, swap presets to target the gap, relabel axes. Same "detect struggle → adapt" loop as
  hints; it touches tutor-generated content only.

## Roadmap (frames in place; components plug in per module)

| Lab | Module | Makes tangible |
|---|---|---|
| **Vectors & Similarity** ✅ live | `01-embeddings`, `02-vector-store` | dot · length · normalize · cosine · euclidean |
| **Chunking & Overlap** ✅ live (2026-06-16) | `02-vector-store` | why long text is split; what overlap buys; the duplicated-token cost |
| Top-k Retrieval | `03-rag-pipeline` | a query pulling its nearest neighbours from a corpus |
| Precision & Recall | `04-rag-quality` | sliding the cutoff; hits / misses / false alarms |

Phase 2+ candidates (not yet registered): softmax/temperature, tokenization, attention as a
weighted sum, a 2-D projection (PCA) of *real* embedded points. Add them when the matching module
goes live — never speculatively (cf. `PLATFORM.md` → "premature generality").

## Lab #1 — what it does

A draggable 2-D plane (grab either arrow tip; tweens on normalize/preset) with a live readout
built to make the *dot product* click for someone who doesn't read notation:

- **Mental-model line** up top: "dot product = how much the arrows agree, size included; cosine =
  the same, size-blind, −1…1."
- **"Dot product, built up"** — the centrepiece. One diverging bar per axis: multiply A's number
  by B's; same sign → bar goes **right** (agree), opposite → **left** (disagree); the bars add to
  the total. This turns "multiply pairwise and sum" into "tally agreement per axis." With
  `lab.json` the axes carry meaning ("topic: account / login"), so big agreement on the login
  axis = high similarity — straight from the embeddings lesson.
- **Cosine gauge** −1…1 with a plain-language verdict, and a footer showing cosine = dot ÷ lengths.
- **The "length means two things" card** — the crux: 2 components vs. the arrow's measured length,
  side by side, updating as you drag.
- **`normalize` toggle** — glides both arrows onto the (now large, legible) unit circle so only
  direction is left; lengths tick to 1.00.
- **Dot-product projection** (optional) — the geometric reading: dot = length of A × how far B
  reaches along it.
- **Scenario presets** from `lab.json` (query/document example texts), including the
  *same-direction-different-length* case for the magnitude lesson; **contextual coaching** names
  what the current geometry is doing.

New deps are fair game if a future lab needs them (the user has okayed this); lab #1 stays
hand-rolled SVG to match the cockpit exactly.

Persistent footnote: it's 2-D so you can see it; real embeddings carry 384 numbers; the math —
and the intuition — is identical.

## A note on the prime directive

The course's prime directive forbids the tutor writing solution code into scaffold gaps. The
lab's `vec.ts` contains `dot`/`mag`/`cosine`/etc., but it is **not** a drop-in for any gap: it's
2-D and `{x, y}`-shaped, whereas the curriculum's `cosineSimilarity(a: number[], b: number[])`
runs over arbitrary-length embeddings — a different signature and shape. The formula itself is
already printed in `01-embeddings/LESSON.md §3`; the lab teaches the *intuition* behind it, and
the learner still writes (and gets checks to pass on) their own array implementation. The lab is
cockpit app code — the "generic-dev" layer the tutor builds — not curriculum.

## Scope & provenance

This doc is the **dedicated plan** for the lab. The explicit-decision moment anticipated here
happened on **2026-07-02** (full-repo audit, learner-mandated): with two labs live and lab.json
generation folded into the module-generation protocol in `CLAUDE.md`, the lab was judged
load-bearing and `PLATFORM.md` now carries a pointer (cockpit paragraph, freeze-exemption note).
`CURRICULUM.md` remains untouched — the lab supplements modules; it isn't part of the spine.
