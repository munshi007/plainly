'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseProfile, detectModeSwitch } = require('../hooks/plainly.js');

const HOOK = path.join(__dirname, '..', 'hooks', 'plainly.js');
const TEMPLATE = path.join(__dirname, '..', 'templates', 'reader.md');

function run(which, input, env) {
  const out = execFileSync(process.execPath, [HOOK, which], {
    input: JSON.stringify(input),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  return out ? JSON.parse(out).hookSpecificOutput.additionalContext : '';
}

function tmpHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'plainly-test-'));
}

test('template placeholders are ignored', () => {
  const p = parseProfile(fs.readFileSync(TEMPLATE, 'utf8'));
  assert.strictEqual(p.mode, 'ground-up');
  assert.deepStrictEqual(p.sections, {});
});

test('parses domains and mode', () => {
  const p = parseProfile('---\ndefault_mode: peer\n---\n# Expert in\n- sourdough\n- knife skills\n# New to\n- Kubernetes\n');
  assert.strictEqual(p.mode, 'peer');
  assert.deepStrictEqual(p.sections['expert in'], ['sourdough', 'knife skills']);
  assert.deepStrictEqual(p.sections['new to'], ['Kubernetes']);
});

test('invalid mode ignored', () => {
  assert.strictEqual(parseProfile('---\ndefault_mode: verbose\n---\n').mode, null);
});

test('mode switch detection', () => {
  assert.strictEqual(detectModeSwitch('/plainly peer'), 'peer');
  assert.strictEqual(detectModeSwitch('/plainly:plainly kid'), 'kid');
  assert.strictEqual(detectModeSwitch('plainly mode bridge'), 'bridge');
  assert.strictEqual(detectModeSwitch('Plainly: ground-up please'), 'ground-up');
  assert.strictEqual(detectModeSwitch('plainly off'), 'off');
  assert.strictEqual(detectModeSwitch('plainly peer reviewed work is better'), null);
  assert.strictEqual(detectModeSwitch('what is an anchor'), null);
  assert.strictEqual(detectModeSwitch('plainly off topic, but what is X?'), null);
});

test('session start without profile offers setup', () => {
  const home = tmpHome();
  const ctx = run('session', { session_id: 's1' }, { PLAINLY_HOME: home });
  assert.match(ctx, /PLAINLY ACTIVE — default explanation mode: ground-up/);
  assert.match(ctx, /plainly setup/);
});

test('session start with profile injects summary', () => {
  const home = tmpHome();
  fs.writeFileSync(path.join(home, 'reader.md'), '---\ndefault_mode: bridge\n---\n# Expert in\n- sourdough\n# New to\n- Kubernetes\n');
  const ctx = run('session', { session_id: 's1' }, { PLAINLY_HOME: home });
  assert.match(ctx, /mode: bridge/);
  assert.match(ctx, /Expert in: sourdough/);
  assert.match(ctx, /New to: Kubernetes/);
});

test('mode switch persists for the session only', () => {
  const home = tmpHome();
  let ctx = run('prompt', { session_id: 'abc', prompt: '/plainly peer' }, { PLAINLY_HOME: home });
  assert.match(ctx, /switched to peer/);
  ctx = run('prompt', { session_id: 'abc', prompt: 'what is a pod?' }, { PLAINLY_HOME: home });
  assert.match(ctx, /^PLAINLY \(peer\)/);
  ctx = run('prompt', { session_id: 'other', prompt: 'hi' }, { PLAINLY_HOME: home });
  assert.match(ctx, /^PLAINLY \(ground-up\)/);
});

test('off silences reminders, on restores', () => {
  const home = tmpHome();
  run('prompt', { session_id: 'x', prompt: 'plainly off' }, { PLAINLY_HOME: home });
  assert.strictEqual(run('prompt', { session_id: 'x', prompt: 'hello' }, { PLAINLY_HOME: home }), '');
  assert.strictEqual(run('session', { session_id: 'x' }, { PLAINLY_HOME: home }), '');
  run('prompt', { session_id: 'x', prompt: 'plainly on' }, { PLAINLY_HOME: home });
  assert.match(run('prompt', { session_id: 'x', prompt: 'hello' }, { PLAINLY_HOME: home }), /PLAINLY \(ground-up\)/);
});

test('session id cannot escape state dir', () => {
  const home = tmpHome();
  run('prompt', { session_id: '../../evil', prompt: '/plainly kid' }, { PLAINLY_HOME: home });
  assert.ok(fs.existsSync(path.join(home, '.sessions', 'evil')));
  assert.ok(!fs.existsSync(path.join(home, '..', 'evil')));
});

test('garbage input fails silent', () => {
  const out = execFileSync(process.execPath, [HOOK, 'prompt'], { input: 'not json', encoding: 'utf8' });
  assert.strictEqual(out, '');
});
