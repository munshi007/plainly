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
  The ticket rail:      Whoever takes the     A message queue:
  servers clip an       order hands off and   the website clips
  order and go back     moves on; stations    each online order
  to the floor.         pull tickets when     on, says "got it",
                        they're ready.        and systems catch up.

  SO YOU CAN NOW
  Ask your developer how many orders were lost in rushes — that
  number says whether a queue is worth paying for now.

  ▾ LEFT OUT (2)
  · Cost: one more system to set up, pay for and watch.
  · Where it breaks: a queue can copy one order to kitchen, payments
    and email at once. A paper ticket can't.
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
