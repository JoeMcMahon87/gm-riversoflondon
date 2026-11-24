# Rules data and copyright

What game data ships in this repository, where the line was drawn, and why. Moved out of
`CLAUDE.md`, which keeps only the rules.

---

## 1. The constraint

Rivers of London: the Roleplaying Game is copyright Chaosium Inc.; Rivers of London and
its characters are copyright Ben Aaronovitch. The published books carry an explicit
reproduction notice permitting the copying of character sheets, maps, handouts and rules
summaries **for in-game use**, and prohibiting reproduction otherwise.

A virtual tabletop extension distributed to other people is not in-game use of a
photocopier. The working rule for this repository is therefore:

> **No rules text, statistics, descriptions, or artwork from the game is committed to
> this repository.**

## 2. What does ship, and the argument for it

`src/rules/skills.ts` contains the **names** of the skills and their category, and
nothing else. No descriptions, no values, no examples, no opposing skills, none of the
per-skill prose that makes up the chapter.

The argument: a bare list of skill names is functional game mechanics rather than
protected expression, and a sheet cannot be built without them. The alternative, making
the GM type thirty-six skill names before using the extension, would defeat the purpose
without protecting anything.

The same reasoning covers the numeric thresholds encoded in `src/rules/`: a fumble range
of 90 and above, 280 characteristic points, magic points as POW divided by five. These
are the mechanics themselves, cited to their page so they can be checked, and they
cannot be expressed any other way.

**Where the line sits:** names and numbers, yes. Sentences from the book, no. The
`DEGRADATION_TABLE` descriptions in `src/rules/magic.ts` are paraphrases written for the
roll log, not transcriptions.

## 3. What does not ship

- Adversary and NPC statistics, including everything in the GM reference booklet.
- Spell descriptions, effects, and the spell list itself. `Spells.tsx` holds whatever
  the practitioner's player typed.
- Skill descriptions, and the Regular and Hard difficulty examples for each.
- Occupations, advantages, disadvantages.
- Scenario content of any kind.
- Any artwork.

## 4. Why the statblock library exists

The library is the designed answer to §3. A GM enters an NPC once, from their own copy of
the rules, and reuses it. It is stored in `localStorage`, exports to JSON, and is never
committed.

This is also why the library ships empty rather than with a seed file. A seed file is
exactly the thing §1 forbids, and an empty library plus an importer achieves the same
convenience without it.

## 5. The repository is private, and that is not the whole answer

The repository being private makes the question moot today. It is recorded here because
the rule was adopted on the assumption the repository might not stay private, and
because a private repository with bundled rules content cannot later be made public
without an audit nobody will want to do.

Keeping the line now costs nothing. Moving it later costs a rewrite.

## 6. The repository went public on 2026-11-24, and §5's bet paid

§5's first sentence is no longer true and is left standing rather than rewritten,
because the prediction is the informative part: the audit §5 was written to avoid is the
one that did not have to happen.

The publication audit found no rules text, statistics, descriptions, or artwork in the
tree, and none in any commit of the history either. Not merely none shipping today:
none ever committed, so nothing survives in an old revision for a fork to recover.
`skills.ts` holds names, `src/rules/` holds cited numbers, and `magic.ts`'s
`DEGRADATION_TABLE` holds the paraphrases §2 claims it holds.

**The line does not move now that the repository is public.** It was drawn at the level
a public repository needs, which is why publication required no change to it. The
statblock library stays empty and unseeded (§4), and a pull request adding a seed file
is refused on §1 regardless of who can see the repository.

One thing publication did change: the game material this project was prepped from lives
outside the repository, one directory up. It is untracked and must stay that way. Moving
the repository root up a level would commit a shelf of Chaosium PDFs in a single
`git add`.
