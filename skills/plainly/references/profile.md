# Reader profile — setup and updates

The profile is a plain Markdown file the user owns:
`$PLAINLY_PROFILE`, else `~/.config/plainly/reader.md`.
Template: `templates/reader.md` in the plugin root (`${CLAUDE_PLUGIN_ROOT}/templates/reader.md`).

## Setup ("plainly setup")

Keep it under two minutes. Ask at most three questions, in one message:

1. What are you genuinely expert in? Narrow topics, e.g. "bandit algorithms",
   not "maths".
2. What do you work with but not deeply? And what are you new to?
3. Which default: ground-up (assume nothing), bridge (relate to what I know),
   or peer (keep the jargon)?

Then write the file from the template with their answers. Show the final file
and the path. Don't invent entries they didn't give.

**In a git repo**, you may also offer: "Want me to add the areas of this repo
you've committed to? I'll look at `git log --author`." If yes, run
`git log --author="$(git config user.email)" --name-only --since=12.months --pretty=format:` ,
group by top-level directory or module, and propose 3–6 entries for
**Comfortable with** (not Expert in — commits show contact, not mastery). Let
the user edit before saving.

## Updates

- "I'm expert in X" / "I don't know Y" / "always peer for SQL" → offer once to
  add it to the right section. Edit in place; never rewrite the user's other
  lines.
- Never write to the profile without the user agreeing in this session.

## Rules

- Per-domain, narrow entries. Expertise is task-specific: knowing bandits says
  nothing about knowing Flyway.
- The profile is a guess about the reader. The reader's words in this session
  beat it every time.
- Nothing in it is sent anywhere. It's read locally by the session hook and the
  skill.
