# Rolling

How a percentile roll resolves, what a bonus die actually does, and how Luck is priced.
Moved out of `CLAUDE.md`, which keeps only the rules.

Page numbers are from the core rulebook, `cha3200` v1.4.

---

## 1. The ladder has four thresholds, not five

**Rivers of London has no Extreme success.** The book states the order outright (p. 116):

```
Critical Success > Hard Success > Regular Success > Failure (or Weak Success) > Fumble
```

This is worth recording because the obvious assumption is wrong. Chaosium's Call of
Cthulhu 7e, which shares the engine, has an Extreme tier at one fifth of the skill
value, and a port written from BRP habit rather than from this book will add it. The
crib sheet's only occurrence of the word "extreme" is "Extremely strong", describing a
vestigium.

| Level | Condition |
|---|---|
| Critical | 01 |
| Hard | at or below half the value |
| Regular | at or below the value |
| Failure | above the value |
| Fumble | 100, or 90+ while impaired |

Half values round down, matching the character sheet's own worked example that half of
STR 40 is 20.

## 2. Fumbles are checked first, and impairment is why

**An impaired character can fumble a roll that came in under their skill.** While
impaired, any result of 90 or above is a fumble rather than only 100 (p. 145). A
Bloodied investigator with Magic 98 who rolls 95 has fumbled, even though 95 is well
under 98.

`resolveRoll` therefore tests the fumble range before any success. Getting this order
wrong produces a bug that is nearly invisible at the table, because the dice look like
an ordinary success and nobody questions it.

This is also the reason impairment is derived rather than asked for. The rule is missed
precisely when the GM is busy, which is exactly when a checkbox goes unticked.

## 3. A bonus die must compare results, not dice

**A bonus die is an extra tens die, and one units die is read against both** (p. 111).
The book's example: tens dice of 20 and 60 with a units die of 4 give 24 or 64.

The subtlety is in which one counts. Consider tens dice of 00 and 90 with a units die of
0:

| Tens die | Combined result |
|---|---|
| 00 | 100 |
| 90 | 90 |

The raw tens dice say 00 is the lower and therefore better die. The combined results say
00 is a **fumble**, the worst result on the table, and 90 is merely a failure. An
implementation that compares raw tens hands a bonus die the single worst outcome
possible.

`rollPercentile` compares the combined results. The book's wording supports this
directly: it says to use the tens die that *yields* the better result, not the lower
tens die. Pinned by
`test_a_bonus_die_prefers_ninety_to_a_zero_tens_die_that_would_combine_to_one_hundred`.

**Bonus and penalty dice do not stack** (p. 111). At most one of either applies, which
is why `DiceModifier` is a three-state flag rather than a count.

## 4. Luck lowers the result; every price follows from that

**Luck is not spent to buy a level of success. It is spent to lower the dice result, one
point per Luck point, and the level follows** (p. 113). The book's example: Nafeesa rolls
34 against Stealth 30 and spends 4 Luck, moving the dice to exactly 30 for a Regular
success.

Modelling it the other way round, as a price per tier, would be both wrong and
unnecessary. `luckOptions` computes each tier's cost as `result - threshold`, which
produces the book's answer for the book's example and needs no table.

What Luck cannot do (p. 114):

- It cannot be spent on Luck rolls.
- It cannot alter the result of a pushed roll.
- **Fumbles always apply and cannot be bought off.** `luckOptions` returns an empty list
  for a fumble rather than trusting each caller to remember this.
- A player may only spend Luck on their own rolls.

Two spends have flat prices and so live on the sheet rather than in the log: Trying Your
Luck at 10 points (p. 114), and surviving a fatal blow at 30 (p. 133).

## 5. Where the roll log keeps both numbers

Spending Luck does not replace the entry. The log keeps the result the dice produced and
notes what it was bought up to, because a log that shows only the purchased outcome
removes the table's ability to see what actually happened.

The log also renders both candidate results when a modifier applied, with the discarded
one struck through. The reason is the same: the rule in §3 is counterintuitive enough
that a table should be able to see it was applied rather than take it on trust.

## 6. Not implemented

- **Opposed rolls and tiebreakers** (pp. 116, 118). `compareSuccess` exists and orders
  levels correctly, but nothing drives two tokens against each other yet.
- **Pushed rolls** (p. 108). The consequence of a failed push is a GM judgment, and
  there is no state tracking whether a roll was a push.
- **Human Limits** (p. 111): an unopposed roll becomes Hard when the opposing value is 70
  or above. `HUMAN_LIMIT_THRESHOLD` records the number, but difficulty is the GM's call
  and the roller does not apply it on its own.
