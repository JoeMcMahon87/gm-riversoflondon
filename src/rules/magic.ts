/**
 * Spellcasting costs and the consequences of pushing a practitioner too far.
 *
 * Magic in Rivers of London punishes overreach with a second roll rather than with a
 * flat penalty, and that second roll (Hyperthaumaturgical Degradation) can kill an
 * investigator outright from full health. Its table is encoded here because the
 * outcomes are damage values that feed straight into the damage track, and because the
 * three situations that trigger it are easy to miss in play.
 *
 * A leaf module: it imports only from ``./types``, and nothing from Owlbear Rodeo.
 */

import { SuccessLevel } from "./types.ts";

/**
 * What a failed Hyperthaumaturgical Degradation roll does to a practitioner.
 *
 * Attributes:
 *     magicPointsRemaining: Always zero. Every outcome drains the caster completely;
 *         the field exists so a caller applying the result does not have to remember
 *         that the drain is unconditional.
 *     damage: Damage inflicted, as a single blow. Four is a mortal wound and five is a
 *         fatal blow, so these feed ``conditionFor`` as ``largestBlow``.
 *     description: What the table says happens, for the roll log.
 */
export interface DegradationOutcome {
    magicPointsRemaining: number;
    damage: number;
    description: string;
}

/**
 * The Hyperthaumaturgical Degradation table, keyed by the POW roll's level of success
 * (core book p. 177).
 *
 * Note how little the good outcomes help: even a Critical success empties the caster's
 * magic points, and a plain Failure is a mortal wound. This is the table that makes
 * casting on empty a genuinely bad idea rather than a tax.
 */
export const DEGRADATION_TABLE: Record<SuccessLevel, DegradationOutcome> = {
    critical: {
        magicPointsRemaining: 0,
        damage: 0,
        description: "Magic points reduced to zero, but no damage suffered.",
    },
    hard: {
        magicPointsRemaining: 0,
        damage: 1,
        description: "Magic points reduced to zero, and 1 damage suffered.",
    },
    regular: {
        magicPointsRemaining: 0,
        damage: 2,
        description: "Magic points reduced to zero, and 2 damage suffered.",
    },
    failure: {
        magicPointsRemaining: 0,
        damage: 4,
        description: "Magic points reduced to zero, and 4 damage suffered: a mortal wound.",
    },
    fumble: {
        magicPointsRemaining: 0,
        damage: 5,
        description:
            "Magic points reduced to zero, and severe physical trauma: 5 damage, a fatal blow. " +
            "Spend 30 Luck immediately to reduce this to a mortal wound, or die.",
    },
};

/** Why a practitioner is rolling for Hyperthaumaturgical Degradation (core book p. 177). */
export type DegradationTrigger = "fumbled-casting" | "failed-pushed-casting" | "cast-while-empty";

/**
 * Whether the POW roll for Hyperthaumaturgical Degradation incurs a penalty die.
 *
 * Only a fumbled *pushed* casting roll carries the penalty. An ordinary fumble and
 * casting on empty are bad enough without it (core book p. 177).
 */
export const degradationPenaltyDie = (trigger: DegradationTrigger, fumbledThePush: boolean): boolean =>
    trigger === "failed-pushed-casting" && fumbledThePush;

/**
 * The magic point cost of casting a spell.
 *
 * The base cost is the spell's order. Boosting raises the cost further, and only some
 * mastered spells can be boosted at all, so the boost is passed in rather than derived
 * (core book p. 176).
 *
 * Args:
 *     order: The spell's order, which is its base cost in magic points.
 *     boost: Extra magic points poured in to increase or alter the effect. Zero for an
 *         ordinary casting.
 *
 * Returns:
 *     The total magic points the casting costs.
 */
export const spellCost = (order: number, boost: number = 0): number => order + boost;

/**
 * Whether attempting this casting will force a Hyperthaumaturgical Degradation roll
 * before the spell is even resolved.
 *
 * A practitioner with no magic points left may keep casting, but every such attempt
 * costs them a POW roll against the table above. There is no need to track negative
 * magic points (core book p. 172).
 */
export const willDegradeOnCast = (currentMagicPoints: number): boolean => currentMagicPoints <= 0;
