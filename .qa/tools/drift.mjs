#!/usr/bin/env node
// Doc drift check: compares doc-snapshot/pages/*.md with the live docs.
// Each snapshot file is <path with "/" -> "_">.md; the live copy is https://docs.copilotkit.ai/<path>.md.
// Never edits the snapshot. Writes <out>/drift.json, <out>/drift.md and <out>/live/<file> for changed pages.
// Exit 0 always (drift is reported, not fatal), unless --strict and something drifted.
//
//   node tools/drift.mjs [--snapshot doc-snapshot/pages] [--out out/drift] [--base https://docs.copilotkit.ai] [--strict]
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);
const snapDir = args.snapshot || "doc-snapshot/pages";
const outDir = args.out || "out/drift";
const base = (args.base || "https://docs.copilotkit.ai").replace(/\/$/, "");

const norm = (s) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd()).join("\n").trim();

function lineDiff(a, b) {
  // Multiset line diff: good enough to size the change for a summary.
  const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
  const ca = count(a.split("\n")), cb = count(b.split("\n"));
  let removed = 0, added = 0;
  for (const [l, n] of ca) removed += Math.max(0, n - (cb.get(l) || 0));
  for (const [l, n] of cb) added += Math.max(0, n - (ca.get(l) || 0));
  return { added, removed };
}

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "text/markdown" }, signal: AbortSignal.timeout(30000) });
      return { status: r.status, text: r.ok ? await r.text() : "" };
    } catch (e) {
      if (i === 2) return { status: 0, text: "", error: String(e.message || e) };
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const files = fs.existsSync(snapDir) ? fs.readdirSync(snapDir).filter((f) => f.endsWith(".md")).sort() : [];
fs.mkdirSync(path.join(outDir, "live"), { recursive: true });
const results = [];
const queue = [...files];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const f = queue.shift();
      const docPath = f.replace(/\.md$/, "").replace(/_/g, "/");
      const url = `${base}/${docPath}`;
      const live = await get(`${url}.md`);
      const snap = norm(fs.readFileSync(path.join(snapDir, f), "utf8"));
      let state;
      if (live.status !== 200) state = live.status === 404 ? "gone" : "error";
      else state = norm(live.text) === snap ? "same" : "changed";
      const row = { file: f, url, state, status: live.status };
      if (live.error) row.error = live.error;
      if (state === "changed") {
        Object.assign(row, lineDiff(snap, norm(live.text)));
        fs.writeFileSync(path.join(outDir, "live", f), live.text);
      }
      results.push(row);
    }
  }),
);
results.sort((a, b) => a.file.localeCompare(b.file));
const by = (s) => results.filter((r) => r.state === s);
const drifted = results.filter((r) => r.state !== "same");
const report = { checkedAt: new Date().toISOString(), base, snapshot: snapDir, pages: results.length, drifted: drifted.length, results };
fs.writeFileSync(path.join(outDir, "drift.json"), JSON.stringify(report, null, 2));

let md = `## Doc drift\n\n${results.length} snapshot pages checked against ${base}: `;
md += `${by("same").length} same, ${by("changed").length} changed, ${by("gone").length} gone, ${by("error").length} fetch errors.\n`;
if (!results.length) md += `\nNo snapshot pages found in \`${snapDir}\`.\n`;
if (drifted.length) {
  md += `\n| Page | State | Lines +/- |\n|---|---|---|\n`;
  for (const r of drifted) {
    const d = r.state === "changed" ? `+${r.added} / -${r.removed}` : r.error || `HTTP ${r.status}`;
    md += `| [${r.file.replace(/\.md$/, "")}](${r.url}) | ${r.state} | ${d} |\n`;
  }
  md += `\nLive copies of changed pages: \`drift/live/\`. The snapshot is not updated by CI.\n`;
}
fs.writeFileSync(path.join(outDir, "drift.md"), md);
console.log(md);
process.exit(args.strict && drifted.length ? 1 : 0);
