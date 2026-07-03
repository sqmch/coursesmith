// Pull engine updates into this instance. Safe because engine paths and course
// paths are disjoint (see README "Your copy vs. the canvas") — your course files
// are never touched by an engine merge.
//
// Remote resolution: `upstream` if you renamed it to push your course to your
// own origin; otherwise `origin` (the clone-and-go case, still pointing at the
// canvas repo).
import { execSync } from "node:child_process";

const sh = (cmd) => execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

const remotes = sh("git remote").split(/\r?\n/).filter(Boolean);
const remote = remotes.includes("upstream") ? "upstream" : "origin";

// the engine's default branch, straight from the remote — never assume
const head = sh(`git ls-remote --symref ${remote} HEAD`);
const branch = head.match(/^ref: refs\/heads\/(\S+)\s+HEAD/m)?.[1] ?? "master";

console.log(`[update] pulling engine updates from ${remote}/${branch} ...`);
execSync(`git pull ${remote} ${branch}`, { stdio: "inherit" });
console.log(`[update] done — if study/ dependencies changed, run: npm install`);
