#!/usr/bin/env node
// Live format eval: runs real `claude -p` sessions with this plugin loaded and
// checks each answer against the output contract.
//
//   node evals/run.js [--runs N]
//
// Costs real tokens (one session per prompt per run). Uses a throwaway profile.

'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIMITS = { 'ground-up': 300, bridge: 250, peer: 150, kid: 180 };
const PROMPTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8'));
const runs = Number((process.argv.indexOf('--runs') > -1 && process.argv[process.argv.indexOf('--runs') + 1]) || 1);

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'plainly-eval-'));
fs.writeFileSync(path.join(home, 'reader.md'), fs.readFileSync(path.join(__dirname, 'reader.md'), 'utf8'));

function ask(prompt) {
  return new Promise(resolve => {
    const p = spawn('claude', ['-p', '--plugin-dir', ROOT, '--allowedTools', 'Skill'], {
      cwd: home, env: { ...process.env, PLAINLY_HOME: home },
    });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.stdin.end(prompt);
    p.on('close', () => resolve(out));
  });
}

function words(s) {
  return (s.replace(/```[\s\S]*?```/g, ' ').match(/[A-Za-z0-9][\w'’.-]*/g) || []).length;
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
  };
}

(async () => {
  const jobs = [];
  for (let r = 0; r < runs; r++) for (const p of PROMPTS) jobs.push(ask(p.prompt).then(t => ({ p, t })));
  const results = await Promise.all(jobs);
  const outDir = path.join(home, 'answers');
  fs.mkdirSync(outDir);
  let pass = 0;
  results.forEach(({ p, t }, i) => {
    const s = score(t, p.maxWords);
    const ok = s.header && s.soYouCan && s.receipt && s.withinLimit && (!p.expectMode || s.mode === p.expectMode);
    if (ok) pass++;
    fs.writeFileSync(path.join(outDir, `${i}-${p.id}.md`), t);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${p.id.padEnd(18)} mode=${String(s.mode).padEnd(9)} words=${String(s.words).padStart(4)}/${s.limit}  header=${+s.header} soYouCan=${+s.soYouCan} receipt=${+s.receipt}${p.expectMode && s.mode !== p.expectMode ? `  (expected ${p.expectMode})` : ''}`);
  });
  console.log(`\n${pass}/${results.length} passed. Answers: ${outDir}`);
})();
