# What a coding agent needs from this package, measured

What it costs to have a coding agent build a small form with this package, given nothing but the
installed package and a task statement.

## The setup

- The agent: Claude Code run headless (`claude -p`) on Sonnet (`claude-sonnet-5-5`), capped at
  $1.00 per run.
- The app: a fresh React 19 + TypeScript app with `@react-formkit/core` 0.2.2 installed from a
  packed tarball (`npm pack`). Nothing is published to npm yet; the tarball is what a publish would
  ship. The workspace held no copy of this repository.
- The score: a hidden acceptance test the agent never sees, run after the agent stops.
- Three runs per task. Cost is the run's reported API cost; turns are the agent's turn count.

## The two tasks

**T1, a config-driven form whose validation tightens.** One text field, `nick`, built from a
`FormConfig`. It needs at least 2 characters while a `tightened` prop is false and at least 8 while
it is true, and the prop can flip while the form stays mounted.

**T2, a form with a French validation message.** One required text field, `name`. Submitting it
empty shows `Champ obligatoire`, and every other form in the app keeps the library's default
message for the same rule.

## The price

Package packed from `ca6be3f`, which ships `llms.txt`, `CLAUDE.md` and `AGENTS.md` alongside
`dist`:

| Task | Pass | Cost per run, mean (range) | Turns per run, mean (range) |
|---|---|---|---|
| T1 config form, rule tightens | 3/3 | $0.17 ($0.14-0.20) | 13.7 (11-18) |
| T2 per-form French message | 3/3 | $0.13 ($0.12-0.16) | 9.7 (8-12) |

The same tasks against a pack of the parent commit `3835597`, which ships `dist` without those
three guides: T1 3/3 at $0.18 ($0.14-0.20) and 14.7 turns, T2 3/3 at $0.10 ($0.09-0.10) and 6.7
turns.

Shipping the guides did not lower the cost: T1 stayed where it was, and T2 cost more. What they changed is the route on T2. With the guides, 3 of 3 runs
used the documented per-form `messages` prop with a schema builder; without them, 0 of 3 did, and
all three hard-coded `required('Champ obligatoire')` into their own schema instead. The hidden test
passes both, so the pass count does not show the difference.

## What the runs found

4 of the 6 T1 runs reported, unprompted, that changing a prop on the parent wiped what had been
typed into the form, and worked around it (a hand-built `BasicForm` with its own button, a
module-scope `withSubmitButton(BasicForm)`, or the typed value fed back through `useWatch`). The
cause was `Form` building its wrapper component inside render, so each render produced a new
component type and React remounted the form. Fixed in `9918779`
(`fix(form): a parent re-render no longer resets the form`), after these runs.

## Limits

- Three runs per task per package; the ranges overlap on T1, and none of these figures is a rate.
- One model family, and a self-audit: I wrote the package, the tasks and the tests.
- Both packs predate `9918779`, so the T1 figures include runs that worked around the remount.
