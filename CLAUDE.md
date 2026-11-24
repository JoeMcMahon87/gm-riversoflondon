# CLAUDE.md

An Owlbear Rodeo 2.0 extension for Rivers of London: the Roleplaying Game, ported from
`kamejosh/gm-daggerheart`. It tracks tokens and resolves percentile rolls. The rules
live as pure functions in `src/rules/`; everything that touches Owlbear Rodeo lives
outside it. That split is the one architectural commitment in the project, and most of
the rules below exist to protect it.

CLAUDE.md is the rules. The reasons are in `docs/design/`.

## Routing

| Changing… | Read |
|---|---|
| How a roll resolves, Luck pricing, bonus dice | `docs/design/rolling.md` |
| Damage, conditions, impairment | `docs/design/damage.md` |
| What is stored on a token and how it migrates | `docs/design/storage.md` |
| What was dropped from gm-daggerheart and why | `docs/design/port.md` |
| Rules data (skills, spell costs) and copyright | `docs/design/rules-data.md` |
| Dice+ integration, external rollers | `docs/design/dice.md` |

## Commands

```bash
make install            # yarn install
make run                # vite dev server over https (mkcert); OBR needs https
make build              # tsc && vite build, writes dist/
yarn test               # vitest, rules layer only
yarn test:watch         # vitest in watch mode
./node_modules/.bin/tsc --noEmit    # type-check; `npx tsc` picks up a newer global TS and fails
```

## Layout

| Path | What it is |
|---|---|
| `src/rules/` | The game's rules as pure functions. Imports nothing from `@owlbear-rodeo/sdk`, React, or `src/helper/`. This is what makes the rules testable without a virtual tabletop. Keep it that way. |
| `src/helper/` | The seam between rules and platform: metadata records, token mutation, map attachments, the roll broadcast. |
| `src/context/` | Zustand stores. `RollLogContext` and `StatblockContext` persist to `localStorage`; the rest are per-session. |
| `src/components/gmrol/` | The token list and sheet. |
| `src/components/general/` | Reusable UI: roll log, loader, markdown, select. |
| `src/background/init.ts` | Runs once per room: context menus, scene and room metadata defaults. |
| `src/_css/` | SCSS. Base layer plus one file per component area. |

## Invariants (do not break)

**The rules layer**

- `src/rules/` imports nothing from Owlbear Rodeo, React, or `src/helper/`. A rule that
  needs a token has the values passed in.
- Every rule with a book page behind it carries that page number in a comment. A number
  without a citation cannot be checked against the book later.
- Thresholds are named constants, never inline literals. `90` means nothing at a call
  site; `IMPAIRED_FUMBLE_FLOOR` means the impaired fumble range.

**Resolution**

- Every roller, local or external, goes through `rollPercentile`. An external roller
  supplies faces via `facesAsSource`; it never resolves anything itself. A second
  resolution path is how the two drift.
- An external roller failing always falls back to a local roll. A table mid-scene needs
  a number more than it needs the animation.
- There is no Extreme success. The ladder is Critical, Hard, Regular, Failure, Fumble.
  Do not add a fifth-value tier from Call of Cthulhu 7e.
- Fumbles are tested before successes. An impaired character rolling 95 against 98 has
  fumbled.
- Bonus and penalty dice compare the **combined results**, never the raw tens dice. Tens
  of 00 with a units of 0 is 100, the worst result on the table, and comparing raw tens
  would hand a bonus die exactly that. There is a test named for this; keep it.
- Bonus and penalty dice never stack. At most one of either.
- Luck lowers the dice result one point per point. Do not implement it as buying a level
  directly; every tier price follows from the lowered result.
- Fumbles cannot be bought off with Luck, at any price, ever.

**Damage**

- There are no hit points. Never add an `hp` field, a maximum, or a bar.
- `conditionFor` takes the running total **and** the largest single blow. A mortal wound
  and a fatal blow are defined by one blow; the total cannot express them.
- Impairment is derived from the condition and applied by the roll path automatically.
  Never ask the user to tick a box the data already answers.

**Storage**

- New stored fields default on read, in `normalizeToken`. No migrations.
- Nothing derived is stored. Magic point maxima, half values and conditions are
  computed. A stored copy is how a sheet comes to disagree with itself.
- All metadata keys are namespaced under `ID`. Owlbear Rodeo shares one metadata bag per
  item across every installed extension.
- Every token mutation goes through `src/helper/tokenHelper.ts`, which also redraws the
  map attachment. Writing `item.metadata` from a component leaves the map stale.

**Failure handling**

- A failed roll broadcast is logged and swallowed. The roll already happened; failing
  the action because other players' logs did not update is worse than the missing line.
- Attachment failures never fail the edit that caused them.

## Testing

- `yarn test` runs `src/rules/**/*.test.ts` only. The rest of the tree needs a virtual
  tabletop and is not unit-tested.
- Test names are sentences about the behavior. No docstrings on tests.
- Fixture values come from the book's own worked examples where one exists (Nafeesa's
  34 against Stealth 30 costing 4 Luck, STR 40 halving to 20). A test that matches the
  book is a test that can be checked against it.
- Pin a finding with a test. The bonus-die-versus-00 case and the four-damage
  single-blow case are both there because they are counterintuitive, not because they
  were ever broken.

## Out of Scope (do not add)

- **Hit points, in any form.** Decided against because the system does not have them;
  see `docs/design/damage.md`.
- **Bundled Rivers of London rules content.** No adversary statistics, spell
  descriptions, skill descriptions, or rules text. Chaosium's copyright; the statblock
  library exists so the GM enters their own once. Skill *names* are the agreed line.
- **Tabletop Almanac integration.** It is the upstream author's service and has no
  Rivers of London data.
- **dddice**, for now. Dice+ covers 3D dice without an account; dddice would be a
  second integration for the same job.
- **Automatic rules enforcement over GM judgment.** The extension computes and flags; it
  does not block. Casting on an empty pool is labeled, never prevented.
