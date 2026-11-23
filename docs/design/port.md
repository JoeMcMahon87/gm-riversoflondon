# What was ported, and what was dropped

A record of the gm-daggerheart port, so the deletions do not get re-proposed. Moved out
of `CLAUDE.md`, which keeps only the rules.

Upstream: `kamejosh/gm-daggerheart`, MIT licensed, by Joshua Hercher.

---

## 1. The port was worth doing for the plumbing, not the features

Owlbear Rodeo extensions carry a quantity of boilerplate that has nothing to do with any
game: four window entry points, scene-ready and player contexts, item metadata
synchronization with change detection, batched updates, context menu registration, drag
and drop grouping, and a modal and popover lifecycle. That is what was kept.

Almost nothing game-facing survived, which was expected: the two systems share a
publisher's house style and nothing else.

## 2. Kept largely unchanged

`ContextWrapper`, `TokenContext`, `SceneReadyContext`, `PlayerContext`,
`MetadataContext`, `obrHelper`, `AsyncLock`, `multiTokenHelper`, `hooks`, the `_css` base
layer, `Markdown`, `Select`, `Loader`, `DropGroup`, `TokenList`, `TokenIcon`, `Owner`,
`GroupSelect`, `MapButton`, and the structure of `background/init.ts`.

## 3. Deleted, with reasons

| Removed | Reason |
|---|---|
| `HP`, `Thresholds`, `Stress`, `Armor`, `Evasion` | Rivers of London has no hit points and none of these statistics. See `docs/design/damage.md`. |
| `Hope`, `Fear`, `Spotlight` | Daggerheart's metacurrency and turn economy. No counterpart. |
| `Attack`, `Weapons` | Daggerheart's dice-string damage. Rivers of London adds a flat weapon value to a d100 damage roll, so the concept was rebuilt rather than ported. |
| `api/dddiceApi`, `background/dddice`, `background/diceplus`, the `DiceRoller` components, `DDDiceContext`, `DicePoolContext`, `DiceButtonContext` | Deferred. The local percentile roller came first so the rules layer could settle without a third-party service in the loop. dddice is on the roadmap. |
| `StatblockSvg`, `TabletopAlmanacSvg`, the `openapi-typescript` targets in the Makefile | Statblocks came from `api.tabletop-almanac.com`, the upstream author's own service. It holds no Rivers of London data, and there is no equivalent. Replaced by the in-app statblock library. |
| `previewHelpers` | Rendered dddice theme previews. No consumers once the dice room was gone. |
| `_e5ability`, `_pfability`, `_pfspell`, `_statblock-popover`, `_statblock-wrapper`, `_dddice` stylesheets | Leftovers from the author's D&D 5e and Pathfinder extensions. |
| Polyhedral dice SVGs other than D10 | A d100 system needs a percentile pair and nothing else. |
| Patreon and Discord links | They point at the upstream author's accounts. |

## 4. One structural change was made deliberately

**gm-daggerheart mixes resolution into its components.** `rollDualityDice` takes eleven
arguments, several of them React state setters and a dice API handle, and the rules are
interleaved with the rendering.

This port puts the rules in `src/rules/` as pure functions with no Owlbear Rodeo, React,
or `src/helper/` imports. That is what allows 68 unit tests to run in 250ms with no
virtual tabletop, and it is the reason the two counterintuitive rules
(§3 of `docs/design/rolling.md`, §2 of `docs/design/damage.md`) are pinned by tests
rather than discovered at a table.

The cost is one extra layer and the discipline to keep it clean. `CLAUDE.md` states that
as an invariant.

## 5. Conventions inherited rather than chosen

- **Four-space indentation**, from the upstream Prettier configuration. `STYLE.md` asks
  for two-space in TypeScript. Four was kept so the ported files and the new ones match;
  reversing it is one `prettier --write` away and touches every file.
- **The `_css` structure** and SCSS module naming.
- **Yarn 1.22 and the Makefile targets**, minus the `openapi-typescript` ones.
