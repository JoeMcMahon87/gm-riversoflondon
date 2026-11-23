/**
 * Derive the numbers a character sheet calculates from its characteristics.
 *
 * Every value here is one the printed sheet works out for you in a box next to the
 * characteristic that drives it, which is exactly why they belong in one place: a
 * change to POW has to move magic points, and a change to a characteristic has to move
 * its half value, or the sheet quietly disagrees with itself.
 *
 * A leaf module: it imports only from ``./types``, and nothing from Owlbear Rodeo.
 */

import { Characteristic } from "./types.ts";

/** Characteristics are bought in blocks of ten, from 30 to 80 (core book p. 45). */
export const MIN_CHARACTERISTIC = 30;

/** The ceiling at character creation; play can raise a characteristic past it. */
export const MAX_CHARACTERISTIC = 80;

/** Characteristic values are assigned in blocks of ten. */
export const CHARACTERISTIC_STEP = 10;

/** An average human characteristic, and the sheet's default (p. 45). */
export const AVERAGE_CHARACTERISTIC = 50;

/** Creation distributes exactly 280 points across the five characteristics (p. 45). */
export const CHARACTERISTIC_POINTS = 280;

/** Starting Luck is 2D10 + 50 (p. 45). */
export const STARTING_LUCK_BASE = 50;

/** The default MOV rating; the Speedy advantage raises it to 9 (p. 50). */
export const DEFAULT_MOV = 8;

/** MOV with the Speedy advantage. */
export const SPEEDY_MOV = 9;

/**
 * An unopposed roll is Hard rather than Regular when the opposing value is 70 or above.
 *
 * This is the "Human Limits" rule (p. 111). It sets difficulty, so it is the GM's call
 * rather than something the roller applies on its own, but the threshold belongs here
 * with the other numbers it is checked against.
 */
export const HUMAN_LIMIT_THRESHOLD = 70;

/** POW is divided by this to give a practitioner's base magic points (p. 172). */
const MAGIC_POINT_DIVISOR = 5;

/**
 * The half value of a characteristic or skill, used for Hard successes.
 *
 * Halves round down, matching the sheet's worked example that half of STR 40 is 20.
 */
export const halfValue = (value: number): number => Math.floor(value / 2);

/**
 * A practitioner's maximum magic points.
 *
 * Mastering a spell permanently raises the ceiling by one, so the count of mastered
 * spells is part of the calculation rather than a separate bonus (core book p. 172).
 *
 * Args:
 *     pow: The character's POW.
 *     masteredSpells: How many spells they have mastered.
 *
 * Returns:
 *     The maximum magic points available to them in a scene.
 */
export const magicPointMax = (pow: number, masteredSpells: number = 0): number =>
    Math.floor(pow / MAGIC_POINT_DIVISOR) + masteredSpells;

/**
 * Roll starting Luck: 2D10 + 50.
 *
 * Args:
 *     random: A function returning an integer in ``[0, max)``, injected so tests can
 *         supply known dice.
 */
export const rollStartingLuck = (random: (max: number) => number): number =>
    STARTING_LUCK_BASE + (random(10) + 1) + (random(10) + 1);

/**
 * Whether a set of characteristics is legal at character creation.
 *
 * This is the one validation site for characteristic spreads; the sheet editor and any
 * import path both call it rather than repeating the rule.
 *
 * Args:
 *     values: The five characteristics and their assigned values.
 *
 * Returns:
 *     An empty array when the spread is legal, or one message per rule broken.
 */
export const validateCharacteristics = (values: Record<Characteristic, number>): string[] => {
    const problems: string[] = [];
    const entries = Object.entries(values) as Array<[Characteristic, number]>;

    for (const [name, value] of entries) {
        if (value < MIN_CHARACTERISTIC || value > MAX_CHARACTERISTIC) {
            problems.push(`${name} is ${value}; creation allows ${MIN_CHARACTERISTIC} to ${MAX_CHARACTERISTIC}`);
        }
        if (value % CHARACTERISTIC_STEP !== 0) {
            problems.push(`${name} is ${value}; characteristics are assigned in blocks of ${CHARACTERISTIC_STEP}`);
        }
    }

    const total = entries.reduce((sum, [, value]) => sum + value, 0);
    if (total !== CHARACTERISTIC_POINTS) {
        problems.push(`characteristics total ${total}; creation distributes exactly ${CHARACTERISTIC_POINTS}`);
    }

    return problems;
};
