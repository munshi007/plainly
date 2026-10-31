---
name: plainly
description: "Explain something to this specific reader, built on what they already know, and say what was left out. Use whenever the user asks what something is, how it works, why it happens, or to explain a doc, PR, error, test failure, concept, system or decision — and whenever they ask for it 'simple', 'in plain English', 'layman terms', 'like I'm new', 'ELI5' or 'from the ground up'. Also use to set up or change the reader profile, or switch explanation mode (ground-up, bridge, peer, kid). Not for rewriting finished text for readability (use a plain-language skill for that) and not for diagrams."
version: 0.1.0
---

# plainly

Explain a new thing in terms of something this reader already knows, then say
what you left out.

Simplifying is lossy. Every explanation drops things and some add things that
aren't true. Most explainers hide this. This one declares it.

## The output contract — read first

The default answer is **ordinary prose**. Not a table, not a diagram, not a card.

Every default answer has exactly three parts:

1. **One header line**: `◆ plainly · <mode>` (add `· as of <short-sha>` in code mode).
2. **The explanation.** Normal paragraphs in the reader's mode. The anchor is the
   opening move *inside the prose*. It ends with a line that starts
   **So you can now:** and names something the reader can now do or decide.
3. **What I left out.** A short note after a `---` rule. Usually two or three
   bullets. In code mode this becomes the provenance receipt (see below).

Nothing else. No preamble, no "Great question", no summary of the summary.

The three-band card in `references/card.md` is an **optional share format**.
Produce it only when the user asks for a card / something to share, or when the
subject is a whole system and the user wants an overview to pass on. Never as
the reply to an ordinary question. An HTML page is rarer still: only when
explicitly asked.

## Step 0 — Load the reader

Read the profile at `$PLAINLY_PROFILE`, else `~/.config/plainly/reader.md`.
The session hook may already have put a summary of it in context; use that.

- **No profile?** Don't interrogate the user. Use `ground-up`, answer the
  question, and add one line at the very end:
  `(No reader profile yet — say "plainly setup" and I'll make one in a minute.)`
  Say it once per session, not every answer.
- **Setup requested?** Follow `references/profile.md`.

The profile is **per-domain**. The same person is expert in one field and new in
another. A global "simple" setting is wrong in both directions at once: it
patronises the expert and loses the newcomer. Decide per question:

- Topic sits in **New to** (or isn't listed) → explain from the ground up, even
  if they're expert next door. Use their expertise only as the *anchor*.
- Topic sits in **Expert in** → don't explain basics. Go to `peer` unless the
  user's mode says otherwise.
- **Comfortable with** → `bridge`.

The user's explicit mode always wins over the profile's guess. Mode changes
("plainly peer", "/plainly kid", "go deeper", "too basic") last for the session.

## Step 1 — Scope check

Some questions can't be answered well at any length: "explain this whole
codebase", "explain machine learning". Don't attempt them. Say so in one line
and offer two or three task-sized versions:

> That's too big to explain without lying about most of it. Pick a slice:
> the request path for one API call, why `X` exists, or what changed in the last release?

A refusal that scopes down is better than a confident tour that's mostly wrong.

## Step 2 — Pick the anchor

The anchor is **one thing this reader already understands that works the same
way** as the new thing.

- Choose by **relational fit**, not surface look. "A canary release is a
  holdout pointed at risk" works because both compare a small changed group
  against an unchanged baseline. "It's like a traffic light" is surface.
- Prefer, in order: the reader's own **Expert in** domains → their **Anchors
  that work for me** → their own past work (code mode: code they wrote) →
  a universal everyday experience.
- **Know why the anchor behaves as it does** before using it. If you can't say
  what carries over, it isn't an anchor.
- No anchor is perfect. If the mismatch could mislead, state it in one clause
  ("unlike a holdout, the canary group usually isn't random — ...").
- **No good anchor? Use none.** A bad analogy is worse than no analogy:
  readers make errors *because of* it. Lead with a concrete example instead.

## Step 3 — Build outward from the anchor

This is construction, not rewriting. Write in this order, invisibly:

1. **What you already know** — open on the anchor, in a sentence or two.
2. **What carries over** — the shared mechanism.
3. **The new thing** — what differs, carried by **one concrete example** with
   real-looking specifics (two emails, one input and its output, one row).
4. **So you can now:** — one sentence: what they can now do, tell apart, or
   decide.

The reader should never see these as labelled sections. They see prose that
starts somewhere familiar and ends with something usable.

Writing rules (all modes, adjusted by mode):

- **Respect the mode's length** (`ground-up` 150–350 words for one concept).
  This is the rule most often broken. Over the limit? Don't compress
  sentences — **cut whole points**. Explain the one mechanism that answers the
  question; move the rest to the receipt if it's decision-relevant, or end
  with one line: "Want the next layer — X or Y?"
- One idea per paragraph, at most four sentences each.
- Name at most two new terms. Internal names (services, file names, flags) only
  when the reader will need to say or search them.
- Concrete before abstract: the example comes before the general rule.
- Introduce a term only when you need it, define it in the same sentence, then
  use that same word every time.
- Never use a term from the reader's **New to** domains without defining it.
- Don't hedge everything. State what is true; put real uncertainty in one place.

Mode details: `references/modes.md`.

## Step 4 — The fidelity receipt ("What I left out")

After writing, check your own explanation against the source and list:

- **Dropped** — true things you left out **that would change what the reader
  does or decides** if they knew them. Not everything you omitted: a system
  explanation omits 99% by necessity, and listing it all is noise.
- **Bent** — places you simplified so much it's slightly false (a threshold you
  called yes/no, a rule with exceptions you stated as absolute). Name the real
  version.
- **Added** — anything you introduced that isn't in the source: an invented
  example number, an inference, a guess about intent. Mark it as yours.

Each bullet says **what** the real version is and, briefly, **why the
simplification was safe** (or when it stops being safe).

Format:

```
---
**What I left out**
- The real rule is a threshold, not yes/no — it's *what share* of sends had
  nothing comparable. Doesn't change what you'd do unless you're near the line.
- The two-email example is mine, not from the doc.
```

Rules:

- Two or three bullets is normal. Zero is allowed only for a genuinely complete
  answer to a tiny question — then write `**What I left out:** nothing that
  changes the answer.`
- More than five means the explanation is too lossy. Rewrite it instead.
- If you didn't read the source fully (truncated file, skimmed doc), say so
  here. Never imply you read more than you did.

## Step 5 — Teach-back check (silent)

Before sending, check:

- Does the **So you can now:** line name something concrete the reader can do or
  decide? "Understand X better" fails. If you can't write it, the explanation
  failed — fix it, don't send it.
- Would the reader, asked "what does it do?", answer correctly using only what
  you wrote?
- Is every claim in the explanation backed by the source (or marked **Added**)?

Don't optimise for a readability score. Short words with wrong facts is the
failure this skill exists to prevent.

## Code mode

When the subject is code in the current repo (a file, PR, diff, error, test
failure, "how does X work here"), follow `references/code-mode.md`. In short:

- Scope to a task; refuse "explain the whole repo" (Step 1).
- Prefer anchors the reader **wrote** (`git log --author`) — and only anchors
  you **opened this session**, never recalled.
- Every claim about the code cites `file:line`. No citation → don't state it.
- Pin to the commit: header gets `· as of <short-sha>`.
- The receipt becomes three bands: **Read**, **Did not read**, **Left out**.

## Composing with other skills

- Plain-language rewrite skills (e.g. ISO 24495) can run *after* this on the
  prose. This skill decides what to explain and in what order; they polish.
- Diagram/HTML renderers own visuals. If a diagram would genuinely help, offer
  it in one line; don't draw ASCII boxes for anything past a trivial flow.
- Terse/compressed chat styles apply to chatter, not to the explanation body.
  Explanations are reader-facing writing: use full sentences.
