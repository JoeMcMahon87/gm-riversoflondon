/**
 * Turn accumulated damage into a condition, and a successful attack into damage.
 *
 * Rivers of London has no hit points. A character carries a small cumulative damage
 * total, and their condition is read off that total, so there is no bar to deplete and
 * no maximum to configure. The one wrinkle is that the two worst conditions do not come
 * from the total at all: a mortal wound and a fatal blow are triggered by the size of a
 * *single* blow, which is why ``conditionFor`` needs both numbers.
 *
 * A leaf module: it imports only from ``./types``, and nothing from Owlbear Rodeo.
 */

import { DamageCondition, SuccessLevel } from "./types.ts";

/** One point of damage leaves a character Hurt (core book p. 133). */
const HURT_THRESHOLD = 1;

/** Two points leave a character Bloodied, and therefore impaired (p. 133). */
const BLOODIED_THRESHOLD = 2;

/** Three or more points leave a character Down: incapacitated and impaired (p. 133). */
const DOWN_THRESHOLD = 3;

/** Four damage from a single blow is a Mortal Wound, whatever the running total (p. 133). */
const MORTAL_WOUND_BLOW = 4;

/**
 * Five damage from a single blow is a fatal blow (p. 133).
 *
 * An investigator who cannot immediately spend ``FATAL_BLOW_LUCK_COST`` Luck dies
 * outright; spending it reduces the blow to a mortal wound.
 */
const FATAL_BLOW = 5;

/** Damage conditions ordered least to most severe, so severity is an index comparison. */
export const CONDITION_ORDER: readonly DamageCondition[] = [
    "healthy",
    "hurt",
    "bloodied",
    "down",
    "mortally-wounded",
    "dead",
] as const;

/**
 * Work out a character's condition from the damage they have taken.
 *
 * Args:
 *     total: Every point of damage taken so far in the fight. Damage is cumulative
 *         across the whole fight, not per attack.
 *     largestBlow: The most damage taken from any one attack. A mortal wound and a
 *         fatal blow are defined by a single blow rather than by the total, so a
 *         character ground down to 4 total damage across four attacks is Down, while
 *         one struck once for 4 is Mortally Wounded.
 *     luckSpentOnFatalBlow: Whether the investigator paid the 30 Luck that reduces a
 *         fatal blow to a mortal wound. NPCs never can, so this defaults to false.
 *
 * Returns:
 *     The condition the character is now in.
 */
export const conditionFor = (
    total: number,
    largestBlow: number = 0,
    luckSpentOnFatalBlow: boolean = false,
): DamageCondition => {
    if (largestBlow >= FATAL_BLOW) {
        return luckSpentOnFatalBlow ? "mortally-wounded" : "dead";
    }
    if (largestBlow >= MORTAL_WOUND_BLOW) {
        return "mortally-wounded";
    }
    if (total >= DOWN_THRESHOLD) {
        return "down";
    }
    if (total >= BLOODIED_THRESHOLD) {
        return "bloodied";
    }
    if (total >= HURT_THRESHOLD) {
        return "hurt";
    }
    return "healthy";
};

/**
 * Whether a condition impairs the character.
 *
 * Impairment is not cosmetic: it widens the fumble range to 90 and above on every skill
 * roll, so this feeds ``resolveRoll``. Hurt is deliberately excluded, being painful but
 * without mechanical effect (core book p. 144).
 */
export const isImpaired = (condition: DamageCondition): boolean =>
    condition === "bloodied" || condition === "down" || condition === "mortally-wounded";

/**
 * Whether a condition stops the character acting for the rest of the fight.
 *
 * Down and worse are incapacitated; a Bloodied character still acts, merely impaired.
 */
export const isIncapacitated = (condition: DamageCondition): boolean =>
    condition === "down" || condition === "mortally-wounded" || condition === "dead";

/**
 * The damage a successful attack inflicts, before any Luck is spent.
 *
 * A failed or fumbled damage roll still does a point of damage; what it loses is the
 * weapon's contribution, which is why ``weaponDamage`` is dropped rather than the whole
 * result being zero (core book p. 132).
 *
 * Args:
 *     level: The level of success on the damage roll, made against STR for melee or
 *         DEX for firearms, ranged attacks and spells.
 *     weaponDamage: The base damage of the weapon or spell. Zero for an unarmed blow.
 *
 * Returns:
 *     The number of damage points inflicted.
 */
export const damageFor = (level: SuccessLevel, weaponDamage: number = 0): number => {
    switch (level) {
        case "critical":
            return 3 + weaponDamage;
        case "hard":
            return 2 + weaponDamage;
        case "regular":
            return 1 + weaponDamage;
        case "failure":
        case "fumble":
            return 1;
    }
};
