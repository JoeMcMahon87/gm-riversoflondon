# Storage

What is stored on a token, what is deliberately not, and why there are no migrations.
Moved out of `CLAUDE.md`, which keeps only the rules.

---

## 1. Where the data lives

| Store | Holds | Lifetime |
|---|---|---|
| Item metadata, `itemMetadataKey` | The whole sheet: characteristics, skills, spells, weapons, damage, Luck, magic points | With the token, in the scene |
| Scene metadata, `metadataKey` | Token groups, their open state, the version that last wrote the scene | With the scene |
| Room metadata, `metadataKey` | Table-wide settings | With the room |
| `localStorage` | The roll log, the statblock library | With the browser |

**Every key is namespaced under `ID`.** Owlbear Rodeo gives each item a single metadata
bag shared by every installed extension, so an unqualified key such as `data` would
collide with the next extension that thought of it.

## 2. The statblock library is in localStorage on purpose

A library of NPCs is the GM's prep, not a property of one room. Putting it in
`localStorage` lets it follow them from room to room; putting it in scene metadata would
trap it in whichever scene it was first typed into.

The cost is that it lives in one browser and is not shared with players. For adversary
statistics that is the desired behavior rather than a limitation, and the export and
import buttons exist for the case where the browser changes.

## 3. New fields default on read. There are no migrations

`normalizeToken` fills in anything a stored record is missing, and the completed record
is written back the next time the token changes.

The alternative, a migration pass, would have to walk every scene the user has ever
made, triggered at a moment when the extension cannot know which scenes exist. Defaulting
on read costs one exhaustive function and nothing else.

**The obligation this creates:** `normalizeToken` must stay exhaustive. Adding a field to
`RoLMetadata` without adding it there produces an `undefined` that will surface somewhere
far away.

## 4. Nothing derived is stored

Magic point maxima, half values, and the damage condition are all computed on read.

The reason is specific rather than aesthetic: a stored maximum is how a sheet comes to
disagree with itself. Mastering a spell raises the magic point ceiling by one. If the
ceiling were stored, mastering a spell would have to remember to update it, and the two
would drift the first time anything else wrote the record.

`magicPointMax` is called at every point of use, including inside `setMagicPoints` and
`restoreMagicPoints`, so there is no path that can cap a pool against a stale number.

## 5. Records are plain and serializable

Metadata round-trips through Owlbear Rodeo unchanged, so the stored shapes are plain
objects: no class instances, no `Map`, no `undefined` where a default belongs. This is
why `types.ts` uses `interface` throughout and why `RoLMetadata` has no methods.

## 6. One write path

Every mutation goes through `src/helper/tokenHelper.ts`. It writes the metadata **and**
redraws the map attachment, in batches of 16 because Owlbear Rodeo rejects oversized
updates.

A component writing `item.metadata` directly would skip the redraw and leave the map
showing a condition the sheet no longer agrees with. There is no second write path, and
there should not be one.

## 7. Secondary failures do not cost the primary action

`updateTokenMetadata` catches and logs attachment failures rather than propagating them.
The sheet is the primary record; losing a label on the map is not worth failing the
whole edit over. The same reasoning governs the roll broadcast in `rollHelper.ts`: the
roll has already happened and the roller can see it, so a failed broadcast is logged and
the roll stands.
