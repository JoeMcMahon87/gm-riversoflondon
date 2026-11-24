/**
 * Roll percentile dice and work out what the result means.
 *
 * This is the whole of Rivers of London's resolution system: roll d100, compare against
 * a skill or characteristic, and read off a level of success. The awkward parts that
 * earn their place here rather than in a component are the 00+0 = 100 wraparound, the
 * shared units die behind a bonus or penalty die, and impairment moving the fumble
 * range, all of which are easy to get subtly wrong by hand at the table.
 *
 * A leaf module: it imports only from ``./types``, and nothing from Owlbear Rodeo.
 */

import { DiceModifier, PercentileRoll, SUCCESS_ORDER, SuccessLevel } from "./types.ts";

/** A roll of 01 is a Critical success (core book p. 107). */
const CRITICAL_RESULT = 1;

/** A roll of 100 is a Fumble for an unimpaired character (core book p. 107). */
const FUMBLE_RESULT = 100;

/**
 * While impaired, any roll of 90 or above is a Fumble (core book p. 145).
 *
 * This is the only reason the rules layer needs to know a character is hurt, and it is
 * the rule most often missed in play, because the dice look like an ordinary failure.
 */
const IMPAIRED_FUMBLE_FLOOR = 90;

/** "Trying Your Luck" costs a flat 10 Luck to use half a characteristic as a skill (p. 114). */
export const TRYING_YOUR_LUCK_COST = 10;

/** Retaining a skill gained through Trying Your Luck costs a further 10 Luck (p. 114). */
export const RETAIN_SKILL_COST = 10;

/** Surviving a fatal blow costs 30 Luck, reducing the damage to a mortal wound (p. 133). */
export const FATAL_BLOW_LUCK_COST = 30;

/** A function returning an integer in `[0, max)`; injected so tests can roll known dice. */
export type RandomSource = (max: number) => number;

/** The default random source, used whenever a caller does not supply its own. */
export const defaultRandom: RandomSource = (max: number) => Math.floor(Math.random() * max);

/**
 * Reduce a reported die to a 0-9 face.
 *
 * A d10 is read as 0-9 by some rollers and 1-10 by others, and an external roller does
 * not say which it uses. Taking the value modulo ten is correct for both: a ten becomes
 * the zero it represents, and every other value is already its own face.
 */
export const normalizeD10 = (value: number): number => ((value % 10) + 10) % 10;

/**
 * Turn a fixed list of die faces into a ``RandomSource``.
 *
 * This is what lets dice rolled somewhere else go through exactly the same resolution
 * as dice rolled here, rather than growing a second implementation of the tens/units
 * combining and the bonus-die comparison.
 */
export const facesAsSource = (faces: readonly number[]): RandomSource => {
    let index = 0;
    return () => faces[index++];
};

/**
 * Combine a tens die and a units die into a 1-100 result.
 *
 * The tens die reads 00-90 and the units die 0-9, so a literal sum would produce a 0
 * that no table has ever rolled. Double zero is 100 instead, which is why this is a
 * function rather than an addition at each call site.
 *
 * Args:
 *     tens: The tens die, 0-90 in steps of ten.
 *     units: The units die, 0-9.
 *
 * Returns:
 *     The percentile result, 1-100.
 */
export const combineDice = (tens: number, units: number): number => {
    if (tens === 0 && units === 0) {
        return FUMBLE_RESULT;
    }
    return tens + units;
};

/**
 * Roll percentile dice, applying a bonus or penalty die if one is in play.
 *
 * A bonus or penalty die is an extra *tens* die, not an extra whole roll: one units die
 * is rolled and read against each tens die, then the better or worse of the two results
 * is taken (core book p. 111).
 *
 * The comparison is deliberately made on the combined results rather than on the raw
 * tens dice. Against tens dice of 00 and 90 with a units die of 0, the raw tens suggest
 * 00 is the lower and therefore better die, but it combines to 100, a fumble, while 90
 * combines to 90. Comparing raw tens would hand a bonus die the worst result on the
 * table.
 *
 * Args:
 *     modifier: Whether a bonus die, a penalty die, or neither applies. Bonus and
 *         penalty dice do not stack, so there is never more than one extra die.
 *     random: The source of randomness, injected so tests can supply known dice.
 *
 * Returns:
 *     The dice rolled and the result they produced.
 */
export const rollPercentile = (modifier: DiceModifier = "none", random: RandomSource = defaultRandom): PercentileRoll => {
    const tensCount = modifier === "none" ? 1 : 2;
    const tens: number[] = [];
    for (let i = 0; i < tensCount; i++) {
        tens.push(random(10) * 10);
    }
    const units = random(10);

    const candidates = tens.map((t) => ({ tens: t, result: combineDice(t, units) }));
    const chosen = candidates.reduce((best, candidate) => {
        if (modifier === "penalty") {
            return candidate.result > best.result ? candidate : best;
        }
        return candidate.result < best.result ? candidate : best;
    });

    return { tens, units, chosenTens: chosen.tens, result: chosen.result };
};

/**
 * Work out the level of success a result achieves against a target value.
 *
 * Fumbles are tested before successes on purpose. An impaired character rolling 95
 * against a skill of 98 has fumbled, even though the result is under the target.
 *
 * Args:
 *     result: The percentile result, 1-100.
 *     target: The skill or characteristic value being rolled against.
 *     impaired: Whether the character is impaired, which widens the fumble range from
 *         100 alone to 90 and above.
 *
 * Returns:
 *     The level of success, from ``critical`` down to ``fumble``.
 */
export const resolveRoll = (result: number, target: number, impaired: boolean = false): SuccessLevel => {
    const fumbleFloor = impaired ? IMPAIRED_FUMBLE_FLOOR : FUMBLE_RESULT;
    if (result >= fumbleFloor) {
        return "fumble";
    }
    if (result === CRITICAL_RESULT) {
        return "critical";
    }
    if (result <= hardThreshold(target)) {
        return "hard";
    }
    if (result <= target) {
        return "regular";
    }
    return "failure";
};

/**
 * The highest result that still counts as a Hard success.
 *
 * Half values round down, matching the "half value of STR 40 is 20" worked example on
 * the character sheet.
 */
export const hardThreshold = (target: number): number => Math.floor(target / 2);

/**
 * Compare two levels of success, for resolving opposed rolls.
 *
 * Returns a positive number when ``a`` beats ``b``, negative when it loses, and zero on
 * a tie, so it can be passed straight to ``Array.sort``.
 */
export const compareSuccess = (a: SuccessLevel, b: SuccessLevel): number =>
    SUCCESS_ORDER.indexOf(a) - SUCCESS_ORDER.indexOf(b);

/** A level of success Luck could buy, and what it would cost in Luck points. */
export interface LuckOption {
    level: SuccessLevel;
    cost: number;
}

/**
 * Work out what each better level of success would cost in Luck points.
 *
 * Luck does not buy a level directly; it lowers the dice result one point per Luck
 * point, and the level follows from the lowered result (core book p. 113). The book's
 * worked example is a roll of 34 against Stealth 30: four Luck points buy the Regular
 * success, because they move the dice to exactly 30.
 *
 * A fumble yields no options at all. Fumbles always apply and cannot be bought off,
 * which is worth enforcing here rather than trusting every caller to remember it.
 *
 * Args:
 *     result: The percentile result as rolled.
 *     target: The skill or characteristic value rolled against.
 *     impaired: Whether the character is impaired, which may make this roll a fumble.
 *
 * Returns:
 *     One entry per level of success better than the one already achieved, cheapest
 *     first. Empty when the roll is a fumble or already a Critical success.
 */
export const luckOptions = (result: number, target: number, impaired: boolean = false): LuckOption[] => {
    const current = resolveRoll(result, target, impaired);
    if (current === "fumble") {
        return [];
    }

    const reachable: Array<{ level: SuccessLevel; needed: number }> = [
        { level: "regular", needed: target },
        { level: "hard", needed: hardThreshold(target) },
        { level: "critical", needed: CRITICAL_RESULT },
    ];

    return reachable
        .filter((tier) => compareSuccess(tier.level, current) > 0 && result > tier.needed && tier.needed >= 1)
        .map((tier) => ({ level: tier.level, cost: result - tier.needed }))
        .sort((a, b) => a.cost - b.cost);
};
