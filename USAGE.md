# Using GM's Rivers of London

This extension tracks Rivers of London investigators and NPCs inside Owlbear Rodeo, and
rolls percentile dice so you do not have to work out what a result means mid-scene.

---

# Adding tokens

Right-click any character, mount, or prop token on the map and choose **Add to tracker**.
The token appears in the extension's list with an average human's characteristics (50
across the board) so it is rollable immediately.

Right-click and choose **Remove from tracker** to take it out again. Removing a token
does not delete anything you typed; adding it back restores the sheet.

Drag tokens between groups to organize them. Groups are per-scene and are managed under
`Settings`.

---

# The damage condition track

Rivers of London has no hit points. A character accumulates damage and their condition
follows from it.

| Damage | Condition | Effect |
|---|---|---|
| 1 | Hurt | In pain, no mechanical effect |
| 2 | Bloodied | Impaired |
| 3 or more | Down | Incapacitated and impaired |
| 4 in one blow | Mortal Wound | Down, and dies within the hour without medical aid |
| 5 in one blow | Fatal blow | Dead, unless 30 Luck is spent immediately |

Click a step on the track to set that condition. Use `+1` and `-1` to count damage
during a fight, and `Clear` when the fight ends.

**The last two conditions come from a single blow, not the running total.** A character
who takes four separate one-point knocks is Down. A character struck once for four is
Mortally Wounded. The track handles this distinction for you, which is why `+1` four
times is not the same as clicking `Mortal Wound`.

**Impairment is applied automatically.** A Bloodied character or worse fumbles on any
roll of 90 or above instead of only on 100. You do not have to remember this; the roll
buttons already know, and the roll log says `impaired` on any roll where it applied.

---

# Rolling

Click any characteristic or skill value to roll against it. The result appears in the
roll log with its level of success already worked out.

Hover a roll button for the modifiers:

- **BONUS** rolls an extra tens die and keeps the better result.
- **PENALTY** rolls an extra tens die and keeps the worse result.
- **HIDE** (GM only) rolls without telling the table.

Bonus and penalty dice do not stack, so there is only ever one of either.

The log shows both candidate results when a modifier applied, with the discarded one
struck through.

---

# Spending Luck

After a roll, the log offers each better level of success you could buy and what it
costs. Luck lowers the dice result one point per Luck point, so a 34 against a skill of
30 costs 4 Luck for a Regular success.

Click the option to record it. The original roll stays in the log with the improvement
noted, so the table can still see what the dice actually did.

**Fumbles cannot be bought off at any price**, and the log says so rather than offering
options that do not exist.

The two flat-rate Luck spends have their own buttons on the sheet:

- **Try Luck (10)** for Trying Your Luck: roll half a characteristic in place of an
  expert skill nobody present has.
- **Survive (30)** appears only when a fatal blow has landed and reduces it to a mortal
  wound.

---

# Skills

Click the `Skills` heading to collapse or expand the list. A collapsed section shows
how many skills are hidden, and the choice is remembered per token, so a GM can keep a
crowd of NPCs folded away and leave the investigator they are running open.

Click the pencil beside `Skills` to edit. Type to add a skill; the box suggests the
skills the rules name, but accepts anything you type, since the rules themselves invite
new ones.

Expert skills are shown in italics. An investigator who lacks one cannot simply roll it
at 30%: that is what Trying Your Luck is for.

Hover a skill to see its Hard threshold and its band (Amateur, Professional, Expert,
Master).

---

# Spells and magic points

Magic points are calculated as POW divided by 5, plus one for each mastered spell. You
never set the maximum; it follows from the sheet.

Add spells by name with their order, which is their cost in magic points. Mark a spell
`M` when it is mastered.

`Cast` does the whole sequence: it spends the magic points and rolls Magic, applying a
penalty die automatically if the spell is not mastered.

**Casting on an empty pool is flagged, not blocked.** A practitioner may keep casting
with no magic points, but every attempt forces a POW roll for Hyperthaumaturgical
Degradation. The pool turns red and reads `empty`, and the roll log labels such a
casting, so the roll does not get skipped.

`Next scene` refills magic points, which is how they recover.

---

# Showing conditions on the map

The map pin button on a token writes its condition under the token on the map.

Only player tokens are shown to everyone, and only when they are hurt. An NPC's
condition stays in your list, because telling the players a creature is Bloodied is a
choice you make out loud.

---

# Settings

- **Show players the level of success** reveals the interpretation, not just the number.
- **Don't show the changelog on updates** suppresses the update modal.
- **Groups** organize the token list within the current scene.
