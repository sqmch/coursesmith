# learning-harness *(working name)*

An open-source **learning harness**: a file protocol + tutor rulebook that turns the AI
subscription you already pay for (Claude Code or a comparable agentic CLI) into a rigorous,
personal tutor for **learn-by-building** topics.

No API keys, no hosted service, no metered costs. You bring your own frontier agent; the
harness brings the structure that a bare "be my tutor" prompt can never have:

- **A course generated for you, just-in-time** — an onboarding interview produces your course
  spine; each module (lesson, build task, starter scaffold, automated checks, sealed hints) is
  generated when you reach it, calibrated to how the previous one actually went.
- **Real feedback loops** — modules ship with runnable checks. Red → green is the unit of
  progress, not "I think I get it." Generated checks are QA'd against a sealed reference
  solution before you ever see them.
- **Spaced repetition that actually runs** — every session opens with recall questions from a
  quiz bank with due dates, intervals, and honest grading. Miss something and it comes back
  sooner.
- **Sealed, escalating hints** — nudge → approach → near-spoiler, revealed one level at a
  time, never solutions. The tutor is forbidden from writing your code.
- **Memory that survives the chat** — progress, quiz history, and a tutor journal live in
  files, committed to git. Any session, any model, picks up exactly where you left off.

## Status: v0 skeleton — extracted from a live course

This protocol is being extracted **incrementally** from a real course
(AI-engineering fundamentals: RAG, agents, evals) currently being run by its first learner.
Every rule in `CLAUDE.md` exists because its absence caused a real failure there. Expect
breaking format changes until the source course completes; see `docs/ROADMAP.md`.

## Honest scope

The harness's sharpest tool is machine-checkable progress. It is built for topics you learn
by **building** — programming, tools, technical systems — where a scaffold can compile and
checks can fail. Topics without executable output (languages, theory-only subjects) would
degrade to quiz-and-judge tutoring; that is a different product, and this one does not
pretend to be it.

## How to use it (v0)

1. Clone this repo **into a folder named after your course** — one clone per course:

   ```
   git clone https://github.com/sqmch/learning-harness learn-rust
   cd learn-rust
   ```

2. `npm install`, then `npm run dev` (any OS), and open **http://localhost:5173**.
3. You land on the welcome screen with a live terminal beside it. Click **launch claude**,
   then **new course** — the tutor interviews you (topic, goals, background, hours/week,
   what "done" looks like), drafts your course arc, and asks you to review it before
   building anything. The page becomes your course the moment your first module exists.
4. Every sitting after that: open the study, click **start session**. The tutor runs your
   due recall quiz, teaches, hands you the next build task, and updates your files at close.
5. Run checks yourself (the **run checks** button, or `npm run check` inside a module's
   scaffold). Ask for hints when stuck; they unseal one level at a time.

Prefer a bare terminal? Everything works without the study too — open the repo in your
agent and say "new course" / "start session"; the UI is a lens, not a dependency.

Everything the tutor knows about you lives in `tutor/` and `curriculum/` in this repo —
plain markdown and JSON, yours to read, version, and delete. Your course grows *inside your
clone*; this repo is both the engine and your instance.

## Your copy vs. the canvas

The published repo is the **empty canvas** — nobody's course lives upstream. Your clone is
**your instance**: the course files the tutor creates (`COURSE.md`, `curriculum/`, `tutor/`)
occupy paths the engine never ships, so they're yours to commit — the tutor commits at every
session close, making your learning history part of your repo's history.

**Getting engine updates.** Because engine paths and course paths are disjoint, pulling from
the canvas brings you engine improvements (study fixes, protocol changes) without ever
touching your course. `npm run update` does it for you — or `git pull` by hand.

**Backing your course up to your own GitHub.** Clone (don't use GitHub's "Use this template"
— template copies sever the git history that updates flow through), then repoint the remotes:

```
git remote rename origin upstream          # the canvas — engine updates come from here
git remote add origin <your-empty-repo>    # your course history goes here
git push -u origin master
```

`npm run update` finds `upstream` automatically from then on.

**Multiple courses** are simply multiple clones, each named after its course. They're fully
independent — separate git histories, separate tutors, separate sessions. To run two studies
at once, give the second a port: `PORT=7332 npm run dev`.

## The study — the way you'll actually want to work

A local web shell around the same files (nothing runs in a cloud; it owns zero state):

```
npm install && npm run dev     →  http://localhost:5173
```

- **Course rail** — your modules, progress, and current position
- **Typeset doc pane** — lessons, briefs, and quizzes, readable like a book
- **Embedded terminal** — a real PTY in your course repo, with quick actions
  (launch your agent · start session · run the current module's checks)
- **◇ math lab** — interactive visualizations wired to the current module's lesson
  (a registry of labs; the tutor configures them per module via `lab.json`)

The study serves whichever repo holds your course: by default this one (the clone-and-go
case); point it elsewhere with `--repo <path>` or the `HARNESS_REPO` env var.
