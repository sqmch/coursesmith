import { useMemo } from "react";
import { type ModuleInfo, type CheckRunState } from "../api";
import { moduleHasVisuals } from "../lab/registry";

/** The subtle ring class the current module's node carries from an ephemeral
 *  check run (running / pass / fail / crash). Empty string = no ring. */
function checkRingClass(state: CheckRunState | undefined): string {
  if (!state) return "";
  if (state.phase === "running") return "check-running";
  if (state.phase === "done" && state.summary) return `check-${state.summary.outcome}`;
  return ""; // error phase or no summary → no ring
}

export function Rail(props: {
  modules: ModuleInfo[];
  currentModule: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The current module's ephemeral check-run state — tints only that one node. */
  currentCheck?: CheckRunState;
}) {
  const phases = useMemo(() => {
    const byPhase = new Map<number, ModuleInfo[]>();
    for (const m of props.modules) {
      if (!byPhase.has(m.phase)) byPhase.set(m.phase, []);
      byPhase.get(m.phase)!.push(m);
    }
    return [...byPhase.entries()].sort(([a], [b]) => a - b);
  }, [props.modules]);

  let index = 0;

  return (
    <nav className="rail">
      <div className="rail-heading">Course track</div>
      {phases.map(([phase, mods]) => (
        <section className="phase" key={phase}>
          <div className="phase-label">
            <span className="phase-num">{String(phase).padStart(2, "0")}</span>
            {mods.find((m) => m.phaseName)?.phaseName ?? `Phase ${phase}`}
          </div>
          <div className="phase-track">
            {mods.map((m) => {
              const i = index++;
              const isCurrent = m.id === props.currentModule;
              const isSelected = m.id === props.selectedId;
              const ring = isCurrent ? checkRingClass(props.currentCheck) : "";
              return (
                <button
                  key={m.id}
                  className={[
                    "module-row",
                    `status-${m.status}`,
                    isSelected ? "selected" : "",
                    isCurrent ? "current" : "",
                  ].join(" ")}
                  style={{ animationDelay: `${i * 45}ms` }}
                  onClick={() => props.onSelect(m.id)}
                >
                  <span
                    className={`node ${m.bossCheck ? "node-boss" : ""} ${ring}`.trim()}
                    aria-hidden
                  >
                    {m.status === "complete" ? "✓" : ""}
                  </span>
                  <span className="module-meta">
                    <span className="module-title">
                      {m.title}
                      {moduleHasVisuals(m) && (
                        <span
                          className="module-viz"
                          title="has a visualization — see the lesson's ◇ chips"
                        >
                          ◇
                        </span>
                      )}
                    </span>
                    <span className="module-sub">
                      {m.estimatedHours}h · {m.runtime}
                      {m.bossCheck ? " · boss-check" : ""}
                      {isCurrent ? " · ← you are here" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div className="rail-foot">
        Phase 2+ modules appear here
        <br />
        as their content is built.
      </div>
    </nav>
  );
}
