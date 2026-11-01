# Recommendations service — handoff

Written 2 Oct. Updated 14 Oct (see §5) and 20 Oct (see §7).

## 1. What it does

Shows each shopper a "you might also like" row on the product page: eight
items, ranked by how likely the shopper is to click.

## 2. Design (as of 2 Oct)

Ranking runs in a nightly batch job, `rank_batch.py`. At 02:00 it scores every
shopper against every in-stock item and writes the top 50 per shopper to the
`scores` table. The product-page API only reads that table, so a page load
never computes anything.

New shoppers have no row in `scores`, so they get the store's best sellers.

## 3. Files

```
rank_batch.py        nightly scoring job
api/recs.py          reads scores, returns top 8
models/clicks.py     the click-likelihood model
```

## 4. Why batch

Scoring is slow (about 40 ms per shopper), and the product page has a 100 ms
budget. Doing it overnight keeps page loads fast.

## 5. Update — 14 Oct

The nightly batch has been removed. Ranking now happens live, inside the API,
on every product-page request, through `rank_live()` in `api/recs.py`. The
model was rewritten to score only the ~200 items in the current category, which
brings it to about 6 ms per request. The `scores` table was dropped.

New shoppers still get best sellers; `rank_live()` falls back when the shopper
has fewer than 3 past clicks.

`rank_batch.py` was deleted in commit `7c1e0aa`.

## 6. NOT verified — read before relying on any of this

- `rank_live()` has never run against production traffic. It has only run in
  a local test with 1,000 fake shoppers.
- The 6 ms figure is from one laptop benchmark, not from production.
- Nobody has measured whether live ranking changes click rates.

## 7. Update — 20 Oct

`rank_live()` now has a production-like load test: 50,000 simulated shoppers,
p99 latency 9 ms. That replaces the laptop figure in §6.
