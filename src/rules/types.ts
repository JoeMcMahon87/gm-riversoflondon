/**
 * The vocabulary of the Rivers of London rules, shared by every module in `rules/`.
 *
 * Kept free of Owlbear Rodeo and React imports so the rules layer can be unit-tested
 * without a virtual tabletop. Nothing here knows how a value reaches the screen.
 */

/**
 * The five characteristics. Rivers of London drops BRP's SIZ and CHA, so a port of a
 * generic BRP sheet will have two columns this system has no use for.
 */
export type Characteristic = "STR" | "CON" | "DEX" | "INT" | "POW";

/** The five characteristics in character-sheet order (core book p. 45). */
export const CHARACTERISTICS: readonly Characteristic[] = ["STR", "CON", "DEX", "INT", "POW"] as const;

/**
 * The outcome of a percentile roll, best to worst.
 *
 * There is deliberately no Extreme success: Rivers of London uses a four-threshold
 * ladder, unlike Call of Cthulhu 7e, whose fifth-value Extreme tier does not exist here
 * (core book p. 116: `Critical > Hard > Regular > Failure > Fumble`).
 */
export type SuccessLevel = "critical" | "hard" | "regular" | "failure" | "fumble";

/**
 * Success levels ordered worst to best, so a comparison is an index comparison.
 *
 * Opposed rolls resolve by this order, and it is also the order Luck walks up one step
 * at a time.
 */
export const SUCCESS_ORDER: readonly SuccessLevel[] = ["fumble", "failure", "regular", "hard", "critical"] as const;

/**
 * A character's damage condition.
 *
 * Rivers of London has no hit points. Damage is a small cumulative counter and the
 * condition is derived from it, which is why this is a ladder of names rather than a
 * number paired with a maximum.
 */
export type DamageCondition = "healthy" | "hurt" | "bloodied" | "down" | "mortally-wounded" | "dead";

/**
 * A single rolled percentile result and the dice behind it.
 *
 * Attributes:
 *     tens: Every tens die rolled, in the order rolled, each 0-90 in steps of ten. A
 *         roll with a bonus or penalty die has two; an unmodified roll has one.
 *     units: The single units die, 0-9, shared by every tens die. One units die is
 *         rolled no matter how many tens dice there are (core book p. 111).
 *     chosenTens: The tens die the bonus or penalty rule selected.
 *     result: The final 1-100 value to compare against the target.
 */
export interface PercentileRoll {
    tens: number[];
    units: number;
    chosenTens: number;
    result: number;
}

/**
 * How the dice pool was modified.
 *
 * Bonus and penalty dice do not stack: a roll carries at most one of either, so this is
 * a three-state flag rather than a count (core book p. 111).
 */
export type DiceModifier = "none" | "bonus" | "penalty";
