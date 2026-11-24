![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)
![Owlbear Rodeo](https://img.shields.io/badge/Owlbear%20Rodeo-2.0-a4243b)

# GM's Rivers of London

An Owlbear Rodeo extension for running Rivers of London: the Roleplaying Game. It tracks
each investigator and NPC on the map, rolls percentile dice against their skills, and
works out what the result means, including the rules a table reliably forgets in the
middle of a scene.

It is for the person running the game. Players see their own sheets and their own rolls.

---

# Introduction

Rivers of London is a d100 roll-under system. That part is easy to run by hand. What is
not easy is everything stacked around a single roll: whether the character is impaired
and so fumbles on 90 rather than 100, whether a bonus die changes which tens die counts,
what a Hard success needed, how much Luck it would take to buy the failure up into a
success, and whether the practitioner who just cast a spell had any magic points left to
cast it with.

**This extension does that arithmetic and leaves the judgment to you.** Click a skill
and it tells you the result and what level of success it reached. If Luck could still
rescue it, the log prices each option. If the character is Bloodied, the widened fumble
range is already applied and the log says so. If a spell was cast on an empty pool, the
roll is labeled, so the Hyperthaumaturgical Degradation roll does not get skipped.

The damage model is the piece most ported trackers get wrong. Rivers of London has **no
hit points**. A character accumulates damage and their condition is read off it, with
the two worst conditions triggered by the size of a single blow rather than by the
total. Four one-point knocks leave someone Down; one four-point blow is a mortal wound.
The track here distinguishes the two, because nothing else on the sheet can recover that
difference afterwards.

**No rules text, statistics, or artwork from the game ship with this extension.** That
material is copyright Chaosium Inc. and Ben Aaronovitch. The skill list is here as bare
names so a sheet can be built; everything else you enter from your own copy of the
rules, and the statblock library exists so you only have to enter it once.

---

# Getting Started

## Prerequisites

- Node.js 18 or newer
- Yarn 1.22
- An Owlbear Rodeo 2.0 room you are the GM of

## Installation

```bash
git clone https://github.com/JoeMcMahon87/gm-riversoflondon.git  # clone the repository
cd gm-riversoflondon                                           # enter it
make install                                                   # install dependencies
make run                                                       # serve over https://localhost:5173
```

## Trusting the dev certificate

Owlbear Rodeo will only load an extension over https, so the dev server uses
`vite-plugin-mkcert` to generate a local certificate. Its certificate authority has to
be in your system trust store before `make run` will start.

Run this **once**, as yourself, in an interactive terminal:

```bash
CAROOT=~/.vite-plugin-mkcert ~/.vite-plugin-mkcert/mkcert -install   # prompts for sudo
```

Two things about that command are deliberate, and both cost an afternoon to work out:

- **`CAROOT` must point at the plugin's own directory.** The plugin keeps a certificate
  authority separate from mkcert's default `~/.local/share/mkcert`. A plain
  `mkcert -install` installs the wrong authority, and the plugin goes on failing.
- **Do not use `sudo` for the whole command.** Under `sudo`, mkcert builds an authority
  for `root` and installs that instead, leaving the plugin's own authority untrusted. It
  also cannot find your Firefox and Chrome profiles, because it looks in root's home
  directory, which is what produces
  `ERROR: no Firefox and/or Chrome/Chromium security databases found`.

The `sudo` prompt inside the command is expected: writing to the system trust store
needs it, and mkcert asks for it on its own.

If the dev server fails with `failed to execute "tee"` and
`sudo: A terminal is required to authenticate`, the authority is not trusted yet and the
command above is the fix. The error means mkcert tried to install it and could not
prompt.

Browser trust needs NSS's `certutil` (`libnss3-tools` on Debian and Ubuntu). Without it
the server still starts; only the browser warning remains.

## Configuration

Add the extension to a room from Owlbear Rodeo's extension dialog, using the manifest
URL:

```
https://localhost:5173/manifest.json   # local development
https://<your-pages-domain>/manifest.json   # a deployed copy
```

## Deployment

The build is a static site, deployed here on Cloudflare Pages:

```bash
make build   # writes dist/
```

Cloudflare Pages build settings:

| Setting | Value |
|---|---|
| Build command | `yarn build` |
| Output directory | `dist` |
| Root directory | leave blank |
| Node version | from `.nvmrc`, currently `22` |

`.nvmrc` pins the Node version Pages builds with. Without it Pages picks its own
default, which has historically been old enough to fail a Vite 6 build.

`vite-plugin-mkcert` is declared `apply: "serve"`, so it runs only for the dev server
and never during a build. That matters because it needs `sudo` to install a certificate
authority, which no build container can provide; a plugin that ran at build time would
fail on Pages every time.

`_headers` is copied into `dist/` by the build and sets `Access-Control-Allow-Origin`,
which Owlbear Rodeo needs in order to load the manifest.

---

# Usage

Full instructions are in `USAGE.md`, and in the `?` button inside the extension. In
brief:

## Tokens

```
Right-click a token → Add to tracker        # start tracking it
Right-click a token → Remove from tracker   # stop, keeping the sheet
```

## Rolling

Click any characteristic or skill to roll against it. Hover the button for modifiers:

| Control | Effect |
|---|---|
| Click | Roll straight |
| `BONUS` | Roll an extra tens die, keep the better result |
| `PENALTY` | Roll an extra tens die, keep the worse result |
| `HIDE` | GM only. Roll without telling the table |

Bonus and penalty dice do not stack. The log shows both candidate results with the
discarded one struck through.

### 3D dice

Install the [Dice+](https://extensions.owlbear.rodeo/dice-plus) extension in the same
room, reload this one, then pick **Dice+** under `Settings` → `Dice roller`. Rolls are
then thrown as physical dice everyone can watch, and this extension resolves the faces
they land on.

Dice+ is a preference, not a dependency. If it is missing, slow, or errors, the roll
still happens locally and the result is the same; only the animation is lost.

## Damage

| Control | Effect |
|---|---|
| Track step | Set that condition directly |
| `+1` / `-1` | Count damage during a fight |
| `Clear` | End the fight and clear all damage |

Impairment follows from the condition automatically and feeds every roll.

## Luck

The roll log prices each better level of success after a roll. Fumbles are never
offered, because they cannot be bought off. The sheet carries the two flat-rate spends:
`Try Luck (10)` for Trying Your Luck, and `Survive (30)`, which appears only when a
fatal blow has landed.

## Spells

| Control | Effect |
|---|---|
| Order field | The spell's cost in magic points |
| `M` | Mark the spell mastered: no penalty die, and +1 magic point ceiling |
| `Cast` | Spend the points and roll Magic, with the penalty die if unmastered |
| `Next scene` | Refill magic points |

## Statblocks

The library button saves the selected token's sheet under a name and applies it to any
selection later, keeping each token's existing damage. It is stored in your browser, so
it follows you between rooms, and exports to JSON so it can be moved or kept with your
prep.

---

# Roadmap

- [x] Dice+ integration, for 3D dice the whole table can watch
- [ ] Opposed rolls resolved between two tokens, with the tiebreaker rules
- [ ] Pushed rolls tracked on the roll, so a failed push prompts its consequence
- [ ] The Hyperthaumaturgical Degradation POW roll offered directly from a flagged casting
- [ ] Chase and combat round tracking
- [ ] Weapons wired into the damage roll, against STR for melee and DEX for ranged
- [ ] Vestigia and Sense Vestigia prompts for GM-set scene strengths
- [ ] Investigator creation: 280 characteristic points, six starting skills, 2D10+50 Luck

---

# The icon

A custodian helmet with a werelight where the badge sits: the Metropolitan Police and
the Folly in one mark.

The three files in `public/` are white with a single accent, because Owlbear Rodeo does
not recolor extension icons. It renders the file as given, and its chrome is dark, so a
dark silhouette would be invisible on the toolbar. `iconOff.svg` is the same helmet
struck through, with the slash masked out of the shape beneath it so it reads without
assuming a background color.

---

# Credits

Ported from [gm-daggerheart](https://github.com/kamejosh/gm-daggerheart) by Joshua
Hercher, MIT licensed, which supplied the Owlbear Rodeo plumbing this is built on.

Rivers of London: the Roleplaying Game is copyright Chaosium Inc. Rivers of London and
its characters are copyright Ben Aaronovitch. This extension is an unofficial tool and
is not affiliated with or endorsed by either.
