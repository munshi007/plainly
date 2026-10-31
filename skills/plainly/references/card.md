# Share card (optional)

A compressed version of an explanation, for a README, a Slack message, or a
teammate. **Never the default reply.** Produce only when the user asks for a
card / something to share / a summary to send, or explicitly wants an overview
of a large subject to pass on.

Build the prose explanation first (or reuse the one already given), then
compress it. The card must not contain claims the prose didn't.

## Terminal / Slack (plain text)

Keep columns ≤ 22 chars wide, 3 columns, total width ≤ 76.

```
◆ plainly · ground-up                          what I left out ▾

  YOU KNOW          →   CARRIES OVER      →   THIS IS
  A holdout: a small    A small group gets    A canary release:
  group gets something  the change; the       ship to 2% first,
  different, and you    rest is your          watch errors, roll
  compare it to         baseline.             back before the
  everyone else.                              other 98% see it.

  SO YOU CAN NOW
  Decide whether a risky change goes to everyone or to a canary first.

  ▾ LEFT OUT (2)
  · The canary slice usually isn't random (one region, one server) —
    fine for catching crashes, weaker as proof of cause.
  · Real rollouts step up 2% → 10% → 50% with automatic rollback.
    The numbers here are my example.
```

For Slack, wrap the card in a code block so the columns survive.

## Code mode card

Add `as of <sha>` to the header and replace LEFT OUT with the three
provenance bands (READ / DID NOT READ / LEFT OUT), as in `code-mode.md`.

## HTML

Only when explicitly asked for a page or a link. Render the same three bands
plus the receipt as a single responsive page; if the host has a page/artifact
publishing tool, use it, otherwise write a standalone `.html` file and give the
path. Don't invent extra content for the HTML version.
