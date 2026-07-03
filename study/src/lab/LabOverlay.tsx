import { useEffect, useState } from "react";
import type { ModuleLabConfig } from "../api";
import { LABS, defaultLabId } from "./registry";
import "./lab.css";

export function LabOverlay(props: {
  open: boolean;
  onClose: () => void;
  currentModule: string | null;
  moduleConfig: ModuleLabConfig | null;
}) {
  // the learner's own pick wins; otherwise follow the course: the lab.json's
  // focusLab if it names a live lab, else the first live lab for the current
  // module. Derived (not initializer state) so it tracks the course loading
  // and the learner advancing — a useState default would freeze at first render.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const focusLab = props.moduleConfig?.focusLab;
  const focusLabLive = LABS.some((l) => l.id === focusLab && l.status === "live");
  const activeId =
    pickedId ?? (focusLab && focusLabLive ? focusLab : defaultLabId(props.currentModule));
  const active = LABS.find((l) => l.id === activeId) ?? LABS[0];

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && props.onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  const isCurrent = (modules: string[]) =>
    props.currentModule != null && modules.includes(props.currentModule);

  // the focus note only applies to the lab it was written for: the module's
  // focusLab when set (several labs can claim one module), else any current lab
  const showFocus =
    props.moduleConfig?.focus &&
    isCurrent(active.modules) &&
    (!focusLab || focusLab === active.id);

  return (
    <div className={`lab-overlay ${props.open ? "" : "hidden"}`} aria-hidden={!props.open}>
      <header className="lab-topbar">
        <div className="lab-wordmark">
          <span className="lab-mark">◇</span> math lab
          <span className="lab-sub">/ visual intuition for the course</span>
        </div>
        <button className="lab-close" onClick={props.onClose}>
          close <kbd>esc</kbd>
        </button>
      </header>

      <div className="lab-body">
        <nav className="lab-rail">
          <div className="lab-rail-heading">Visualizations</div>
          {LABS.map((lab) => {
            const current = isCurrent(lab.modules);
            return (
              <button
                key={lab.id}
                className={[
                  "lab-rail-item",
                  lab.id === activeId ? "active" : "",
                  lab.status === "planned" ? "planned" : "",
                ].join(" ")}
                onClick={() => setPickedId(lab.id)}
              >
                <div className="lab-rail-title">
                  {lab.title}
                  {current && <span className="lab-chip current">current topic</span>}
                  {lab.status === "planned" && <span className="lab-chip">planned</span>}
                </div>
                <div className="lab-rail-blurb">{lab.blurb}</div>
                <div className="lab-rail-modules">{lab.modules.join(" · ")}</div>
              </button>
            );
          })}
          <div className="lab-rail-foot">
            Each lab ties to a module. New ones plug in as the course grows — see{" "}
            <code>study/LAB.md</code>.
          </div>
        </nav>

        <main className="lab-main">
          {showFocus && (
            <div className="lab-focus">
              <span className="lab-focus-tag">focus</span>
              {props.moduleConfig!.focus}
            </div>
          )}
          {active.status === "live" && active.component ? (
            <active.component
              config={isCurrent(active.modules) ? props.moduleConfig : null}
              moduleId={props.currentModule}
            />
          ) : (
            <div className="lab-placeholder">
              <div className="lab-placeholder-mark">◇</div>
              <h2>{active.title}</h2>
              <p>{active.blurb}</p>
              <p className="lab-placeholder-meta">
                Arrives with module <strong>{active.modules.join(", ")}</strong>. The frame is
                here; the visualization plugs into this same shell.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
