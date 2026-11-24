# Dice

How a roll gets its numbers, and why an external roller never resolves anything. Moved
out of `CLAUDE.md`, which keeps only the rules.

---

## 1. Two sources of faces, one resolver

A roll can get its dice from one of two places:

| Source | What it is |
|---|---|
| Local | `Math.random`, resolved immediately. The default. |
| Dice+ | A separate Owlbear Rodeo extension rendering 3D physics dice the whole table watches. |

**Both go through `rollPercentile`.** An external roller supplies nothing but die faces,
passed in through `facesAsSource`, and every rule after that point is the same code.

This is the single most important decision in this file. The tens/units combining, the
00+0 wraparound and the bonus-die comparison are all counterintuitive enough to have
earned their own tests (`docs/design/rolling.md` §3). A second resolution path for
external dice would need all of that again, and would silently diverge the first time
one side was fixed.

## 2. d10 faces are normalized because the convention is ambiguous

A d10 reads 0-9 on some rollers and 1-10 on others, and the Dice+ protocol does not say
which it uses. `normalizeD10` takes the value modulo ten, which is correct either way: a
ten becomes the zero it represents, and every other value is already its own face.

This is a guess made safe rather than a guess avoided. If Dice+ ever reported something
outside 0-10, the modulo would quietly produce a wrong face rather than an error, which
is the known weakness of this approach.

## 3. Dice+ is a preference, never a dependency

Every path falls back to a local roll:

- Dice+ not installed, or not answering the startup handshake
- A roll request that times out after 15 seconds
- A notation error
- Fewer dice returned than were asked for

The reason is that the failure happens mid-scene, with a table waiting. A button that
never resolves is worse than one that resolves without an animation. The fallback is
silent in the log but warns in the console.

Note the consequence: a roll **can** be made locally in a room configured for Dice+, and
nothing in the log distinguishes the two. That is deliberate, since the result is equally
valid either way, but it means "the dice did not appear" is not evidence that the roll
did not happen.

## 4. The protocol

Extensions cannot call each other, so the whole exchange is Owlbear Rodeo broadcasts.

| Channel | Direction | Purpose |
|---|---|---|
| `dice-plus/isReady` | both | Handshake. Request carries a `requestId`; the answer carries it back with `ready: true`. |
| `dice-plus/roll-request` | out | A roll, carrying `source` (this extension's `ID`) and a `rollId`. |
| `<ID>/roll-result` | in | The result. Dice+ namespaces the reply by the `source` it was given. |
| `<ID>/roll-error` | in | A rejected notation. |

Requests and replies share the `isReady` channel, so a listener must check for `ready`
rather than assume any message is an answer; the extension hears its own request
otherwise.

Results are matched by `rollId`. Without that, two rolls in flight resolve to whichever
answer arrives first.

`showResults` is sent as `false`: Dice+ totals its own dice, and a sum of d10s is
meaningless in a percentile system. The result is presented in this extension's log.

## 5. Why d10s rather than a d100 notation

The request asks for `2d10`, or `3d10` when a bonus or penalty die applies, and reads
the individual faces.

A `1d100` notation would return a single combined value, which cannot express a bonus
die: that rule needs two *tens* dice read against one shared units die, and which tens
die wins depends on the combined result rather than the raw die. The faces have to stay
separable, so they are requested separately.

The assumption this rests on is that Dice+ reports dice in rolled order, since the last
face is taken as the units die. If a roll with a bonus die ever resolves oddly, this is
the first thing to check.
