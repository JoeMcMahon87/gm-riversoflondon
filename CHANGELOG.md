# Changelog

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
