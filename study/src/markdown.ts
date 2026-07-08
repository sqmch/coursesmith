// The study's single markdown pipeline: marked + marked-highlight + DOMPurify.
// Lessons, journal entries, and tutor notes all render through here, so the
// typography and the sanitize boundary stay identical across the app. DocPane
// builds its own instance on top of `createMarkdown()` to add the ```visual
// fence renderer (which needs a post-render iframe swap); everything that only
// needs prose calls `renderMarkdown()`.

import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import http from "highlight.js/lib/languages/http";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("http", http);

const LANG_ALIASES: Record<string, string> = {
  jsonc: "json",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  js: "javascript",
};

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A fresh Marked wired to the study's highlighter. DocPane extends its own copy
 *  with the ```visual fence; callers that only render prose use `renderMarkdown`. */
export function createMarkdown(): Marked {
  return new Marked(
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
}

const base = createMarkdown();

/** Render trusted-but-sanitized markdown to an HTML string. Sync (the study
 *  never streams docs), so callers can drop it straight into dangerouslySetInnerHTML. */
export function renderMarkdown(raw: string): string {
  return DOMPurify.sanitize(base.parse(raw, { async: false }) as string);
}
