import { useEffect, useRef, useState } from "react";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import http from "highlight.js/lib/languages/http";
import { fetchFile, type ModuleInfo } from "../api";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("http", http);

const LANG_ALIASES: Record<string, string> = { jsonc: "json", sh: "bash", shell: "bash", ts: "typescript", js: "javascript" };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const md = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const l = LANG_ALIASES[lang] ?? lang;
      if (l && hljs.getLanguage(l)) {
        try {
          return hljs.highlight(code, { language: l }).value;
        } catch {
          /* fall through to plain */
        }
      }
      return escapeHtml(code);
    },
  }),
);

const DOC_LABELS: Record<string, string> = {
  "LESSON.md": "Lesson",
  "BRIEF.md": "Brief",
  "quiz.md": "Quiz",
};

export function DocPane(props: { module: ModuleInfo | null }) {
  const [doc, setDoc] = useState<string>("LESSON.md");
  const [html, setHtml] = useState<string>("");
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const articleRef = useRef<HTMLElement>(null);

  const docs = props.module?.docs ?? [];

  useEffect(() => {
    if (props.module) {
      setDoc(props.module.docs.includes("LESSON.md") ? "LESSON.md" : props.module.docs[0]);
    }
  }, [props.module?.id]);

  useEffect(() => {
    if (!props.module) return;
    let cancelled = false;
    setState("loading");
    fetchFile(`curriculum/${props.module.id}/${doc}`)
      .then((raw) => {
        if (cancelled) return;
        const rendered = md.parse(raw, { async: false }) as string;
        setHtml(DOMPurify.sanitize(rendered));
        setState("ready");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [props.module?.id, doc]);

  // copy buttons on code blocks
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "copy";
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "copied";
          setTimeout(() => (btn.textContent = "copy"), 1200);
        } catch {
          btn.textContent = "failed";
        }
      });
      pre.appendChild(btn);
    });
  }, [html]);

  if (!props.module) {
    return <main className="docpane docpane-empty">Select a module.</main>;
  }

  return (
    <main className="docpane">
      <div className="doc-header">
        <div className="doc-kicker">
          {props.module.id}
          <span className={`status-chip status-${props.module.status}`}>
            {props.module.status.replace("-", " ")}
          </span>
        </div>
        <nav className="doc-tabs">
          {docs.map((d) => (
            <button
              key={d}
              className={`doc-tab ${d === doc ? "active" : ""}`}
              onClick={() => setDoc(d)}
            >
              {DOC_LABELS[d] ?? d}
            </button>
          ))}
        </nav>
      </div>

      {state === "loading" && <div className="doc-state">…</div>}
      {state === "missing" && (
        <div className="doc-state">
          This document doesn't exist yet — it's generated when you start the module.
        </div>
      )}
      {state === "ready" && (
        <article ref={articleRef} className="doc" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </main>
  );
}
