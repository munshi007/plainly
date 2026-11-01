#!/usr/bin/env node
// plainly — always-on fragment.
//
//   node plainly.js session  (SessionStart)      inject invariant + reader summary
//   node plainly.js prompt   (UserPromptSubmit)  track mode switches, re-anchor every turn
//
// Why per-turn: instruction-following drifts measurably within a few turns of a
// long conversation. A skill fires episodically; this keeps the contract in view.
// Fails silent: a broken hook must never block the user's prompt.

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const MODES = ['ground-up', 'bridge', 'peer', 'kid'];
const DEFAULT_MODE = 'ground-up';
const MAX_PROFILE_BYTES = 64 * 1024;
const MAX_SECTION_ITEMS = 12;
const MAX_ITEM_CHARS = 120;

const configDir = process.env.PLAINLY_HOME || path.join(os.homedir(), '.config', 'plainly');
const profilePath = process.env.PLAINLY_PROFILE || path.join(configDir, 'reader.md');
const stateDir = path.join(configDir, '.sessions');

function readProfile() {
  try {
    const st = fs.lstatSync(profilePath);
    if (!st.isFile() || st.size > MAX_PROFILE_BYTES) return null;
    return parseProfile(fs.readFileSync(profilePath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function parseProfile(text) {
  const out = { mode: null, sections: {} };
  let body = text;
  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (fm) {
    body = text.slice(fm[0].length);
    const m = /^\s*default_mode\s*:\s*([a-z-]+)/m.exec(fm[1]);
    if (m && MODES.includes(m[1])) out.mode = m[1];
  }
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  let current = null;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^#{1,3}\s+(.+)$/.exec(line);
    if (h) { current = h[1].trim().toLowerCase(); continue; }
    const item = /^[-*]\s+(.+)$/.exec(line);
    if (!current || !item) continue;
    const val = item[1].trim();
    if (/^example\s*:/i.test(val)) continue; // untouched template placeholder
    (out.sections[current] = out.sections[current] || []);
    if (out.sections[current].length < MAX_SECTION_ITEMS) {
      out.sections[current].push(sanitize(val).slice(0, MAX_ITEM_CHARS));
    }
  }
  return out;
}

// Profile is user-owned text going into model context; strip control chars.
function sanitize(s) {
  return s.replace(/[\u0000-\u001f\u007f]/g, ' ');
}

function sessionFile(sessionId) {
  const safe = String(sessionId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  return safe ? path.join(stateDir, safe) : null;
}

function readSessionMode(sessionId) {
  const f = sessionFile(sessionId);
  if (!f) return null;
  try {
    const st = fs.lstatSync(f);
    if (!st.isFile() || st.size > 32) return null;
    const v = fs.readFileSync(f, 'utf8').trim();
    return MODES.includes(v) || v === 'off' ? v : null;
  } catch (e) {
    return null;
  }
}

function writeSessionMode(sessionId, mode) {
  const f = sessionFile(sessionId);
  if (!f) return;
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    try { if (fs.lstatSync(f).isSymbolicLink()) fs.unlinkSync(f); } catch (e) {}
    fs.writeFileSync(f, mode);
  } catch (e) {}
}

function pruneOldSessions() {
  try {
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    for (const name of fs.readdirSync(stateDir)) {
      const f = path.join(stateDir, name);
      try { if (fs.lstatSync(f).mtimeMs < cutoff) fs.unlinkSync(f); } catch (e) {}
    }
  } catch (e) {}
}

// "/plainly peer", "/plainly:plainly kid", "plainly mode bridge", "plainly: ground-up", "plainly off"
function detectModeSwitch(prompt) {
  const p = String(prompt || '').trim().toLowerCase();
  const m = /^\/?plainly(?::plainly)?(?:\s+mode)?[\s:]+(ground-up|groundup|bridge|peer|kid|off|on)(?:\s+mode)?(?:\s+please)?[.!]?$/.exec(p);
  if (!m) return null;
  if (m[1] === 'groundup') return 'ground-up';
  return m[1];
}

function summarizeProfile(profile) {
  if (!profile) return null;
  const pick = (...names) => {
    for (const n of names) if (profile.sections[n] && profile.sections[n].length) return profile.sections[n];
    return null;
  };
  const parts = [];
  const add = (label, items) => { if (items) parts.push(label + ': ' + items.join('; ')); };
  add('Expert in', pick('expert in', 'expert'));
  add('Comfortable with', pick('comfortable with', 'comfortable'));
  add('New to', pick('new to', 'new'));
  add('Anchors that work', pick('anchors that work for me', 'anchors'));
  add('Never do', pick('never do', 'never'));
  return parts.length ? parts.join('\n') : null;
}

function emit(event, text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: text }
  }));
}

function sessionStart(data) {
  pruneOldSessions();
  const profile = readProfile();
  const mode = readSessionMode(data.session_id) || (profile && profile.mode) || DEFAULT_MODE;
  if (mode === 'off') return;
  const summary = summarizeProfile(profile);
  const lines = [
    `PLAINLY ACTIVE — default explanation mode: ${mode}.`,
    'When you explain anything (a concept, doc, PR, error, system, decision), use the plainly skill\'s contract:',
    '1) header line "◆ plainly · ' + mode + '"; 2) prose that opens on something this reader already knows that works the same way, carries one concrete example, keeps to the mode shape (ground-up: max 4 paragraphs — anchor, example, the one rule, optional second part — at most 10 sentences in total; peer at most 5 sentences under 25 words each; "short" from the user = at most 4 sentences under 20 words each and a one-bullet receipt. Count sentences before sending). Answer the question asked, not the whole topic: cut whole points, offer them as "Next layer: ...", and ends with "So you can now: <something they can do or decide>"; 3) after a --- rule, "What I left out": 2–3 bullets of decision-relevant omissions, simplifications that bend the truth, and anything you added.',
    'CODE QUESTIONS (explaining a file, function, PR, diff, error or test in a repo): first invoke the plainly skill with the Skill tool — its code mode has rules this summary omits. Minimum: run git log --author="$(git config user.email)" --name-only to find code the reader wrote, and anchor on one such file you open this session ("like X, which you wrote on <date>"); header "◆ plainly · <mode> · as of <short sha>"; cite file:line for every claim; receipt = three headed sections **Read** / **Did not read** / **Left out**.',
    'SOURCE RULES: describe the design as it is NOW (if the source has later updates, the body uses them, not the receipt); anything the source flags as unproven/untested stays flagged in the body and leads the receipt (if later updates resolve some caveats, go item by item and name the ones still open); before sending an answer about a file you read, run the Final pass from the skill as two tool calls: one grep -n with every cited phrase (fix line numbers from its output) and one grep -n -i for not proven/unverified/untested/never run/TODO/open question (each hit is in the answer, resolved, or irrelevant).',
    'Prose by default. No cards, tables or diagrams unless asked. Write explanations in full sentences even if another style compresses chat.',
  ];
  if (summary) {
    lines.push('Reader profile (' + profilePath.replace(os.homedir(), '~') + '):\n' + summary);
    lines.push('Choose depth per domain: topics in "New to" get ground-up even if they are expert next door; use "Expert in" as anchors.');
  } else {
    lines.push('No reader profile found. Default to ground-up. On the first explanation only, add one closing line offering "plainly setup".');
  }
  emit('SessionStart', lines.join('\n'));
}

function promptSubmit(data) {
  const sw = detectModeSwitch(data.prompt);
  if (sw === 'on') {
    const profile = readProfile();
    writeSessionMode(data.session_id, (profile && profile.mode) || DEFAULT_MODE);
  } else if (sw) {
    writeSessionMode(data.session_id, sw);
  }
  const profile = sw ? null : readProfile();
  const mode = readSessionMode(data.session_id) || (profile && profile.mode) || DEFAULT_MODE;
  if (mode === 'off') {
    if (sw === 'off') emit('UserPromptSubmit', 'plainly turned off for this session. Confirm in one line.');
    return;
  }
  let msg = `PLAINLY (${mode}): if this turn explains something, (code in a repo? invoke the plainly skill first, anchor on code the reader wrote) open on what the reader already knows, one example, max 10 sentences (peer 5; "short" 4 short ones + 1-bullet receipt) — count them, answer only what was asked, offer the rest as "Next layer:", end "So you can now:", then "What I left out". Prose, not cards.`;
  if (sw) msg = `plainly mode switched to ${mode} for this session. Confirm in one line, then continue. ` + msg;
  emit('UserPromptSubmit', msg);
}

function main() {
  const which = process.argv[2];
  let input = '';
  process.stdin.on('data', c => { input += c; if (input.length > 1e6) input = input.slice(0, 1e6); });
  process.stdin.on('end', () => {
    try {
      const data = input.trim() ? JSON.parse(input) : {};
      if (which === 'session') sessionStart(data);
      else if (which === 'prompt') promptSubmit(data);
    } catch (e) {
      // silent
    }
  });
}

if (require.main === module) main();
module.exports = { parseProfile, detectModeSwitch, summarizeProfile, MODES };
