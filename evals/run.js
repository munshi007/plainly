#!/usr/bin/env node
// Live format eval: runs real `claude -p` sessions with this plugin loaded and
// checks each answer against the output contract.
//
//   node evals/run.js [--runs N] [--only <prompt id>]
//
// Costs real tokens (one session per prompt per run). Uses a throwaway profile.

'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIMITS = { 'ground-up': 300, bridge: 250, peer: 150, kid: 180 };
const ONLY = process.argv.indexOf('--only') > -1 ? process.argv[process.argv.indexOf('--only') + 1] : null;
const PROMPTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8'))
  .filter(p => !ONLY || p.id === ONLY);
const runs = Number((process.argv.indexOf('--runs') > -1 && process.argv[process.argv.indexOf('--runs') + 1]) || 1);

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plainly-eval-'));
fs.writeFileSync(path.join(home, 'reader.md'), fs.readFileSync(path.join(__dirname, 'reader.md'), 'utf8'));

function ask(prompt, tools) {
  return new Promise(resolve => {
    const p = spawn('claude', ['-p', '--plugin-dir', ROOT, '--allowedTools', tools || 'Skill'], {
      cwd: home, env: { ...process.env, PLAINLY_HOME: home },
    });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.stdin.end(prompt.split('{ROOT}').join(ROOT));
    p.on('close', () => resolve(out));
  });
}

function words(s) {
  return (s.replace(/```[\s\S]*?```/g, ' ').match(/[A-Za-z0-9][\w'’.-]*/g) || []).length;
}

// Content checks for document-reading cases (see evals/fixtures/):
//   bodyMust      regexes the body must match (current design, unproven flags)
//   answerMust    regexes body or receipt must match (still-open caveats)
//   receiptFirst  regex the first receipt bullet must match (source's headline caveat)
//   stale         { terms, history }: every body sentence naming an old-design term
//                 must also mark it as history, so the body never teaches the old design
function contentChecks(p, body, receipt) {
  const fails = [];
  for (const re of p.bodyMust || []) if (!new RegExp(re, 'i').test(body)) fails.push(`body lacks /${re}/`);
  for (const re of p.answerMust || []) if (!new RegExp(re, 'i').test(body + receipt)) fails.push(`answer lacks /${re}/`);
  if (p.receiptFirst) {
    const first = (receipt.match(/^\s*[-*]\s+(.+)$/m) || [])[1] || '';
    if (!new RegExp(p.receiptFirst, 'i').test(first)) fails.push('first receipt bullet is not the source caveat');
  }
  if (p.stale) {
    const sentences = body.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (new RegExp(p.stale.terms, 'i').test(s) && !new RegExp(p.stale.history, 'i').test(s)) {
        fails.push(`stale design stated as current: "${s.slice(0, 80)}"`);
      }
    }
  }
  return fails;
}

function score(text, maxWords) {
  const header = /^\s*◆ plainly · ([a-z-]+)/m.exec(text);
  const mode = header ? header[1] : null;
  const split = text.split(/^\s*---\s*$/m);
  const body = header ? split[0].slice(split[0].indexOf(header[0]) + header[0].length) : split[0];
  const receipt = split.length > 1 ? split.slice(1).join('---') : '';
  const n = words(body);
  const limit = maxWords || LIMITS[mode] || LIMITS['ground-up'];
  return {
    mode,
    words: n,
    limit,
    header: !!header,
    soYouCan: /So you can now\b/i.test(body),
    receipt: /What I left out|\*\*Left out\*\*/i.test(receipt),
    withinLimit: n <= limit,
    body,
    receiptText: receipt,
  };
}

(async () => {
  const jobs = [];
  for (let r = 0; r < runs; r++) for (const p of PROMPTS) jobs.push(ask(p.prompt, p.tools).then(t => ({ p, t })));
  const results = await Promise.all(jobs);
  const outDir = path.join(home, 'answers');
  fs.mkdirSync(outDir);
  let pass = 0;
  results.forEach(({ p, t }, i) => {
    const s = score(t, p.maxWords);
    const content = contentChecks(p, s.body, s.receiptText);
    const ok = s.header && s.soYouCan && s.receipt && s.withinLimit && (!p.expectMode || s.mode === p.expectMode) && !content.length;
    if (ok) pass++;
    fs.writeFileSync(path.join(outDir, `${i}-${p.id}.md`), t);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${p.id.padEnd(18)} mode=${String(s.mode).padEnd(9)} words=${String(s.words).padStart(4)}/${s.limit}  header=${+s.header} soYouCan=${+s.soYouCan} receipt=${+s.receipt}${p.expectMode && s.mode !== p.expectMode ? `  (expected ${p.expectMode})` : ''}`);
    for (const f of content) console.log(`      ${f}`);
  });
  console.log(`\n${pass}/${results.length} passed. Answers: ${outDir}`);
})();
