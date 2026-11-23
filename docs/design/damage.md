# Damage and conditions

Why there is no HP bar anywhere in this extension. Moved out of `CLAUDE.md`, which keeps
only the rules.

Page numbers are from the core rulebook, `cha3200` v1.4.

---

## 1. There are no hit points

**Rivers of London tracks a small cumulative damage counter and reads a named condition
off it.** There is no pool to deplete and no maximum to configure (p. 133).

| Damage | Condition | Effect in the fight |
|---|---|---|
| 1 | Hurt | In pain, no mechanical effect |
| 2 | Bloodied | Impaired |
| 3 or more | Down | Incapacitated and impaired |
| 4 in a single blow | Mortal Wound | As Down, and needs medical attention within the hour |
| 5 in a single blow | Fatal blow | Dead, unless 30 Luck is spent immediately |

This is the single largest divergence from the extension this was ported from.
Daggerheart's `HP`, `Thresholds`, `Stress` and `Armor` components model a resource that
does not exist here, so they were deleted rather than adapted. See
`docs/design/port.md`.

## 2. The worst two conditions come from one blow, not the total

**A mortal wound and a fatal blow are defined by the size of a single attack.** A
character who takes four separate one-point knocks is Down. A character struck once for
four is Mortally Wounded (p. 133).

The total cannot express this, and the difference cannot be recovered after the fact,
which is why `conditionFor` takes both the running total and the largest single blow,
and why `DamageState` stores both. Pinned by
`test_four_damage_ground_down_across_four_attacks_is_only_down`.

The same reasoning drives the UI: the damage track's `Mortal Wound` step sets a
four-point blow, rather than raising the total to four, because clicking `+1` four times
is genuinely a different outcome.

## 3. Impairment is the reason this file matters to the roller

**Bloodied and worse are impaired, and impairment widens the fumble range to 90 and
above on every skill roll** (pp. 144, 145). This is the one place where the damage model
reaches into resolution, and it is applied automatically.

Hurt is deliberately excluded. The book is explicit that it carries no mechanical effect
(p. 144), so a Hurt character rolls normally.

## 4. Conditions have causes other than damage

`conditionOverride` exists because impairment can come from mental trauma (p. 218) as
well as from combat. Without an override, a GM wanting to mark an NPC impaired would
have to invent damage to explain it, which would then misreport the condition and could
trip the mortal wound threshold.

The override wins over the derived condition wherever it is set, and the sheet labels it
as set by hand so the disagreement between the track and the damage total is explicable.

## 5. The damage roll

Damage is rolled against STR for melee, or DEX for firearms, ranged attacks and spells
(p. 132).

| Level | Damage |
|---|---|
| Critical | 3 + weapon |
| Hard | 2 + weapon |
| Regular | 1 + weapon |
| Failure or Fumble | 1, with no weapon damage |

**A failed damage roll still does a point of damage.** What it loses is the weapon's
contribution, not the whole result, which is why `damageFor` drops `weaponDamage` rather
than returning zero.

## 6. What the map shows, and what it does not

The map attachment draws a condition label, not a bar, and draws nothing at all for a
healthy token. A map of untouched NPCs lined with full bars carries no information.

Only player tokens are shown to the whole table. An NPC's condition stays in the GM's
list, because telling the players a creature is Bloodied is a disclosure the GM makes
deliberately.

## 7. Healing is per fight, not per point

Recovery depends on the condition at the end of the fight (p. 144): Hurt and Bloodied
clear when the fight ends, Down persists until the end of the following day unless 10
Luck is spent, and a mortal wound needs a successful Medicine roll.

The extension models this as a single `Clear` button rather than per-point healing,
because per-point healing is not a thing this system does. The Luck costs and the
Medicine roll are left to the table; `Clear` records the outcome.
