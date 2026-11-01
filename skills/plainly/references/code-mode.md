# Code mode

Use when explaining code in the current repository: a file, function, PR,
diff, error, failing test, or "how does X work here".

In code, explaining is mostly a **retrieval** problem. The skill doesn't do
retrieval itself — use whatever the host has (search tools, an index, an
explore agent, grep). This file governs what you're allowed to claim from
what you found.

## 1. Scope to a task

Works: "explain this PR", "why does this test fail", "what does
`PaymentRetryService` do", "how does a request reach the DB here".

Refuse and scope down: "explain the repo", "explain the backend". Offer
2–3 task-sized slices. A newcomer needs the slice they'll touch first, not the
whole system.

## 2. Pin the commit

Run `git rev-parse --short HEAD`. Header: `◆ plainly · <mode> · as of <sha>`.
If the working tree is dirty in the files you read, add `(+ uncommitted changes)`.
An explanation without a pin silently goes stale after the next merge.

## 3. Choose the anchor from the reader's own code

The reader's commit history is a record of what they already understand here.

1. `git log --author="$(git config user.email)" --name-only --since=12.months --pretty=format:'%h %ad' --date=short`
   (cheap; cap with `| head -200`).
2. Find a file they touched that is **structurally like** the thing being
   explained — same pattern, same layer, same kind of job.
3. **Open it.** The anchor must be a file you actually read in this session,
   not one you recall or infer from its name. Name it with when they touched
   it: "like `RefundService` — you changed it on 3 March — but ...".
4. If nothing they wrote fits, fall back to the profile's expert domains, then
   to none. Don't stretch.

If the user's email has no commits here, skip quietly and use the profile.

## 4. Cite every claim

- Every statement about what the code does carries `file:line` (or a range),
  inline in the prose: "it checks the retry limit first
  (`RetryPolicy.java:18`)".
- Can't cite it? Don't state it as fact. Either go read the code, or mark it
  plainly as a guess: "probably — I didn't open the worker".
- Before sending, verify each citation mechanically: `grep -n` the exact
  symbol or phrase and use the line it returns. Don't trust remembered line
  numbers, even in a file you just read.

## 5. The provenance receipt

Replaces "What I left out" in code mode. Three bands, after the `---`:

```
---
**Read** (4 files)
- `PaymentRetryService.java:30-88`, `RefundService.java:12-40`,
  `RetryPolicy.java:1-25`, `PaymentController.java`

**Did not read** — places this answer could also live
- `worker/` — the nightly job may also retry failed payments
- `WebhookHandler` — the provider's callback can mark a payment paid

**Left out**
- Metrics and logging — doesn't change where your fix goes
```

- **Read**: only files you actually opened, with the ranges you relied on.
- **Did not read**: name concrete places — directories, services, configs,
  callers — where part of the answer could live and you didn't look. This is
  the honest part. Find candidates with a quick search for the symbol or table
  name and list hits you didn't open. If you're confident there are none, say
  "None found — searched for `<symbol>` across the repo."
- **Left out**: same filter as the normal receipt — decision-relevant only.

## 6. Cost

Reading files to cite them costs tokens. Read what the claim needs, not the
whole module. If the question can be answered from a diff alone, cite the diff
and list the rest under **Did not read**.
