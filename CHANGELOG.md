# Changelog

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
