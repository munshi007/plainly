# plainly

**Explains it simply — and shows you what it left out.**

<!-- TODO before launch: replace this block with a screenshot of a real receipt.
     The code-mode "Did not read" band is the one to show. -->
```
---
**Read** (4 files)
- PaymentRetryService.java:30-88, RefundService.java:12-40,
  RetryPolicy.java:1-25, PaymentController.java

**Did not read** — places this answer could also live
- worker/ — the nightly job may also retry failed payments
- WebhookHandler — the provider's callback can mark a payment paid

**Left out**
- Metrics and logging — doesn't change where your fix goes
```

A Claude Code plugin for explanations that fit the person reading them.

- **Starts from what you know.** It keeps a small profile of what you're expert
  in and what you're new to — per domain, because nobody is "technical" or
  "non-technical" across the board. Then it explains the new thing in terms of
  something you already understand.
- **Says what it left out.** Every simplification drops things, and studies of
  AI plain-language summaries found nearly a third added at least one claim
  not in the source. plainly ends every explanation with a short receipt: what it
  dropped that matters, what it bent, what it added.
- **Doesn't drift.** You shouldn't have to say "explain it simply" every
  session. A two-line reminder rides along with each prompt, so the style holds
  in long conversations.
- **In code, cites everything.** Claims carry `file:line`, the answer is pinned
  to a commit, and it lists the places it *didn't* read. If you've committed to
  the repo, it anchors on code you wrote.

## What you get

Ask a normal question. Get a normal answer — prose, not a diagram:

> ◆ plainly · ground-up
>
> **You know how a holdout works?** A small group gets something different,
> everyone else carries on as normal, and you compare the two. A canary
> release is the same idea, pointed at risk instead of lift.
>
> You ship the new version to a small slice of users first — say 2%. The other
> 98% keep the old version. Then you watch both groups side by side.
>
> Say the new version has a bug that only shows up under real traffic. On the
> canary slice, errors jump from 0.1% to 3% within ten minutes. You roll back.
> Only 2% of users ever saw it, and you know the new code caused it because the
> other 98% stayed flat.
>
> **So you can now:** decide whether a risky change should go to everyone at
> once, or to a canary slice first.
>
> ---
> **What I left out**
> - Unlike a holdout, the canary slice usually isn't random — often it's one
>   region or one server. Fine for catching crashes; weaker as proof of cause.
> - Real canaries step up (2% → 10% → 50%) with automatic rollback rules. The
>   2% and 3% figures are my example, not a standard.

## Install

```
/plugin marketplace add munshi007/plainly
/plugin install plainly@plainly
```

Or try it locally without installing:

```
git clone https://github.com/munshi007/plainly && claude --plugin-dir ./plainly
```

Then say **`plainly setup`** to make your reader profile (three questions, under
two minutes). It's a plain Markdown file at `~/.config/plainly/reader.md` that
you own and can edit — see [`templates/reader.md`](templates/reader.md). Nothing
leaves your machine.

## Modes

| Mode | For | Feels like |
|---|---|---|
| `ground-up` (default) | smart, new to this domain | short sentences, one worked example |
| `bridge` | expert next door | "it's like X, except where it isn't" |
| `peer` | fluent in the domain | keeps the jargon, cuts the basics |
| `kid` | an actual child | toys and playgrounds; receipt is for the grown-up |

Switch for the session: `/plainly peer`, `plainly mode bridge`, `plainly off`,
`plainly on`. Or just say "too basic" / "you lost me". Set the default in your
profile.

Depth is also chosen per topic: if your profile says you're new to Kubernetes,
you get `ground-up` for Kubernetes even when your default is `peer`.

## Share cards

Ask for "a card" and you get a compressed three-column version for a README or
Slack. Never by default — a card as the answer to a question is a gimmick.

## Using it without the plugin

Copy `skills/plainly/` into `~/.claude/skills/`, and paste
[`fragment/CLAUDE.md`](fragment/CLAUDE.md) into your `CLAUDE.md` for the
always-on part. You lose the per-turn reminder and mode switching.

## What it doesn't do

- **No readability scores.** They measure word length, not understanding, and
  they're easy to game. The test is whether the answer ends with something you
  can now do or decide.
- **No retrieval.** In code, it uses whatever search your session already has.
  The receipt shows you what that search did and didn't cover.
- **No diagrams.** Use a dedicated renderer (e.g.
  [visual-explainer](https://github.com/djenriquez/visual-explainer)) — plainly
  composes with it.
- **No whole-codebase tours.** "Explain the repo" gets a polite refusal and two
  or three task-sized questions instead.

## Known interactions

Plugins that compress Claude's chat style (e.g. caveman) also inject per-turn
instructions. plainly tells the model to write explanations in full sentences
regardless; chatter outside explanations follows the other style.

## Why it's built this way

Instruction drift within a handful of turns is measured, not
imagined; "simple" means nothing without knowing the reader; and simplified
summaries routinely add facts that aren't in the source — which existing tools
neither catch nor admit.

## Develop

```
npm test                       # hook unit tests
claude plugin validate .       # manifest + skill checks
claude --plugin-dir .          # try it
```

MIT licensed.
