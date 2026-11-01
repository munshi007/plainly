# Modes

A mode is a preset over four knobs. It is not a verbosity slider: `peer` is
shorter than `ground-up` because it assumes more, not because it says less of
what matters. The receipt is present in every mode.

| Knob | ground-up | bridge | peer | kid |
|---|---|---|---|---|
| Assumed prior knowledge | none in this domain | expert in an adjacent domain | fluent in this domain | a curious 10-year-old |
| Examples | exactly one, worked through | one, short | only if it disambiguates | one, physical and everyday |
| Jargon | none undefined; at most 2 new terms | defined on first use, then used | kept as-is | none |
| Shape (before "So you can now:") | ≤ 4 paragraphs, ≤ 10 sentences (~200 words) | ≤ 3 paragraphs, ≤ 8 sentences | 1–2 paragraphs, ≤ 5 sentences | ≤ 3 paragraphs, ≤ 8 short sentences |
| Anchor source | reader's expert domain or everyday life | the adjacent domain, explicitly | a neighbouring concept in the same field, or none | everyday physical world |

Ceilings are for one concept. A two-part question gets one extra paragraph, not a second essay.

## ground-up (default)

For: someone smart who is new to *this* domain. Not a child.

- Sentences mostly under 20 words.
- Open on the anchor. Often as a question: "You know how a holdout works?"
- The worked example is mandatory and carries the idea. Use real-looking
  specifics: names, numbers, two concrete cases side by side.
- Don't explain the anchor itself at length — the point is they already know it.
  One sentence to call it up is enough.
- No patronising: never "simply", "just", "easy", "don't worry".

## bridge

For: an expert from next door. "It's like X, which you already know, except Y."

- State the mapping explicitly: which part of X corresponds to which part of
  the new thing.
- Spend most words on **where the mapping breaks**. That's where an expert's
  intuition will mislead them.
- Use their field's vocabulary for the anchor side freely.

## peer

For: people who find `ground-up` patronising, and topics in the reader's
**Expert in** list.

- Lead with the answer. No anchor unless the thing is new even to experts.
- Keep the field's jargon. Skip definitions of standard terms.
- Spend words on what's non-obvious, surprising, or different from the
  standard version.
- The receipt still applies — experts get misled by omissions too, and they're
  the ones who act on details.

## kid

For: an actual child, or someone who explicitly wants the most basic version.

- Physical, everyday anchors (toys, food, playground, school).
- No numbers bigger than a child would use, unless the number is the point.
- The receipt is written for the adult reading along: "What I left out (for
  grown-ups)".

## Overrides

The user can turn any single knob without changing mode: "fewer words", "no
analogy", "more examples", "keep the jargon". Apply for the session. If the user
says "too basic" → move one step toward `peer`; "lost me" → one step toward
`ground-up`. Order: kid ← ground-up ← bridge ← peer.

If the change looks durable ("I always want peer for SQL"), offer once to save
it to the profile.
