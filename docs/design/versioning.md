# Versioning and releases

How a version number is chosen, where it is written, how a release is cut and tagged,
and why CI refuses a mismatch. Moved out of `CLAUDE.md`, which keeps only the rules.

---

## 1. The scheme

Semantic versioning, `MAJOR.MINOR.PATCH`, read against what a table notices rather than
against the public API: this is an extension with no API and one consumer, the GM.

| Bump | Means |
|---|---|
| MAJOR | Stored token data changes shape in a way an old room cannot read, or a rule the GM relies on resolves differently. |
| MINOR | A new feature on the sheet, the roller, or the map. |
| PATCH | A fix, a wording change, a build or deployment change, nothing new on screen. |

A new stored field is a MINOR, not a MAJOR, because of the storage rule: new fields
default on read in `normalizeToken`, so an old token loads under a new version without
a migration. MAJOR is reserved for the case that rule cannot cover, which has not
happened yet and may never.

The version is not a release train. It is bumped when something ships, not on a date.

---

## 2. Where the version is written

Three places, none of which derive from another:

| File | Why it carries the version |
|---|---|
| `package.json` | The project's own number, and the one `yarn` reports. |
| `public/manifest.json` | What Owlbear Rodeo reads and shows the user in the extension list. |
| `CHANGELOG.md` | The release notes, as a dated `## [x.y.z] - YYYY-MM-DD` section. |

`public/manifest.json` is the one that matters most and the one most easily forgotten.
Owlbear Rodeo caches the manifest a room was added with, so a stale number there is
what a GM sees and reports, long after the deploy.

**Nothing generates one from another.** The manifest is a static file served as-is and
read by Owlbear Rodeo before any of our code runs, so there is no build step that could
inject the version into it without making the manifest a build artifact. Keeping all
three hand-written and checked is simpler than keeping one of them generated.

`scripts/check-version.mjs` is the check: the three agree, the CHANGELOG's newest
section is the current version, and, on a tag build, the tag names it. It runs in CI on
every push and pull request, and locally as `make check-version`.

---

## 3. Cutting a release

The release is the tag. There is no artifact to upload: Cloudflare builds and serves the
extension from `main`, so a tag records which commit a version number refers to, and
nothing more.

1. On a branch, bump `package.json` and `public/manifest.json` to the new version.
2. Add the `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md`, dated the day it ships.
3. `make check-version` to confirm all three agree before pushing.
4. PR into `main`, as with any change. `main` deploys.
5. Tag the merge commit on `main` and push the tag:

```bash
git checkout main && git pull                   # tag what deployed, not a local main
git tag -a v0.3.0 -m "Release 0.3.0"            # annotated, so the tag carries a date and author
git push origin v0.3.0                          # the tag push runs CI again, with the tag check armed
```

Tags are `v`-prefixed (`v0.3.0`), annotated, and never moved. The `v` prefix is what the
version badge in the README sorts on, and a moved tag would make the badge point at a
commit that is no longer what was released.

The version bump and the CHANGELOG section go in **the same commit**. Split across two,
the repository has a commit where the number and the notes disagree, which is exactly
the state the check exists to prevent, and bisecting across it fails the check for a
reason unrelated to the bug being hunted.

---

## 4. What the CHANGELOG is for

It is release notes for the GM, not a commit log. A reader wants to know what changed on
their screen, so entries are written as consequences:

> Casting is possible on a token with no Magic skill recorded yet.

rather than as diffs ("fixed null check in `castSpell`"). Entries are grouped under
`Added`, `Fixed`, `Changed` and `Removed`, and a group with nothing in it is left out.

A finding that changed a decision is worth an entry even when no behavior moved, because
the next question is always "was that deliberate?". 0.2.0's note that the README's
test-count badge was wrong by eight is there for that reason.

**The CHANGELOG is append-at-the-top and not rewritten.** A shipped section describes
what a version did when it shipped; correcting it later would make the notes disagree
with the tag. A later section carries the correction instead.

---

## 5. What is deliberately not automated

- **No release workflow.** A tag does not build a GitHub Release, generate notes, or
  publish anything. Cloudflare already deploys `main`, so a release job would produce an
  artifact nobody installs from, and generated notes would be worse than the hand-written
  ones.
- **No `yarn version` / `npm version`.** It bumps `package.json` only, which would leave
  `public/manifest.json` behind and tag before the CHANGELOG exists. Bump by hand, in
  one commit, and let the check confirm it.
- **No "Unreleased" section.** The dated-section check requires a date, and a long-lived
  Unreleased heading is where entries go to be forgotten. Entries are written in the
  commit that earns them, under the version being cut.
