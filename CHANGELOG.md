# Changelog

## [0.2.1] - 2026-11-24

### Added

- A CI workflow: every push and pull request type-checks, runs the tests, builds, and
  checks that the version is stated consistently. The README's CI badge reports it.
- `make check-version`, which fails if `package.json`, `public/manifest.json` and the
  newest `CHANGELOG.md` section do not name one version. A manifest left at the previous
  version is the expensive mistake, because Owlbear Rodeo shows that number to the GM
  for as long as their room caches the manifest.
- `docs/design/versioning.md`: the version scheme, where the number is written, and how
  a release is cut and tagged.
- A version badge in the README, resolving the newest `vX.Y.Z` tag.
- `NOTICE.md`: how to credit a fork, what the MIT notice has to carry, the upstream port
  credit, and the Chaosium material this deliberately does not contain.

### Changed

- The README's badges link to the file or site that backs each claim, and the license
  badge reads `LICENSE.md` rather than hard-coding MIT.
- `LICENSE` is now `LICENSE.md` and holds the MIT text alone. The notices appended under
  it meant GitHub reported the license as unidentifiable, which is what the README's
  license badge was reporting in turn.
- `package.json` states `"license": "MIT"`, so the license is machine-readable and not
  only a file in the root.

## [0.2.0] - 2026-11-24

### Added

- Dice+ integration: rolls thrown as 3D dice the whole table can watch, with the faces
  they land on resolved through the same roller as a local roll. 0.1.0 listed this as
  deferred; it shipped.
- The roll log in the action window, alongside the token list.
- A collapsible skills list, so a sheet with thirty-six skills does not fill the window.
- Our own icon: a custodian helmet with a werelight badge, replacing the ported one.

### Fixed

- Casting is possible on a token with no Magic skill recorded yet.
- The action window no longer blocks on the background script.
- The manifest description fits Owlbear Rodeo's 128-character limit, which is enforced
  when the extension is added to a room rather than at build time.

### Changed

- `.nvmrc` pins the Node version for Cloudflare Pages builds.
- The dev server binds localhost rather than `0.0.0.0`, so a clone does not serve to the
  whole network.
- The help modal credits the upstream author's Patreon as theirs, rather than inviting
  support "for me".
- The hardcoded test-count badge is gone from the README: nothing verified it, and it
  was wrong by eight.
- The README leads with the hosted manifest URL, and names Cloudflare Workers as what
  serves it rather than Cloudflare Pages, which it never was.

### Removed

- `src/config.ts`, the last reference to the Tabletop Almanac API that 0.1.0 dropped.

## [0.1.0] - 2026-11-23

First version, ported from [gm-daggerheart](https://github.com/kamejosh/gm-daggerheart)
by Joshua Hercher.

### Added

- Damage condition track (Unhurt through Dead), replacing hit points.
- Percentile roller resolving Critical, Hard, Regular, Failure and Fumble.
- Bonus and penalty dice, shown in the log with the discarded die struck through.
- Automatic impairment: 90 and above fumbles for a Bloodied character or worse.
- Luck spending priced per roll, with the flat-rate Trying Your Luck and fatal-blow
  spends on the sheet.
- The five characteristics, each rollable, with half values shown.
- Skills, with the rules' skill list as suggestions and free text for anything else.
- Spells with magic point costs, mastery, and one-click casting that applies the
  unmastered penalty die and flags casting on an empty pool.
- Condition labels drawn under player tokens on the map.

### Removed from the original

- dddice and Dice+ integration, pending a later version.
- Tabletop Almanac statblock API, which has no Rivers of London equivalent.
- Hope, Fear, Stress, Armor, Evasion and damage thresholds, none of which exist in this
  system.
