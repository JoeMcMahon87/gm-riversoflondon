/** Resolving percentile rolls against a skill or characteristic. */

import { describe, expect, it } from "vitest";
import { combineDice, compareSuccess, hardThreshold, luckOptions, resolveRoll, rollPercentile } from "./roll.ts";
import { RandomSource } from "./roll.ts";

/** Feed ``rollPercentile`` a known sequence of die faces, in the order it asks for them. */
const scriptedDice = (faces: number[]): RandomSource => {
    let index = 0;
    return () => faces[index++];
};

describe("combining the two dice", () => {
    it("test_double_zero_is_one_hundred_rather_than_zero", () => {
        expect(combineDice(0, 0)).toBe(100);
    });

    it("test_a_zero_tens_die_reads_as_the_units_alone", () => {
        expect(combineDice(0, 4)).toBe(4);
    });

    it("test_the_highest_pair_is_ninety_nine", () => {
        expect(combineDice(90, 9)).toBe(99);
    });
});

describe("bonus and penalty dice", () => {
    it("test_one_units_die_is_shared_by_both_tens_dice", () => {
        const roll = rollPercentile("penalty", scriptedDice([2, 6, 4]));

        expect(roll.tens).toEqual([20, 60]);
        expect(roll.units).toBe(4);
        expect(roll.result).toBe(64);
    });

    it("test_a_penalty_die_keeps_the_worse_of_the_two_results", () => {
        const roll = rollPercentile("penalty", scriptedDice([2, 6, 4]));

        expect(roll.result).toBe(64);
    });

    it("test_a_bonus_die_keeps_the_better_of_the_two_results", () => {
        const roll = rollPercentile("bonus", scriptedDice([2, 6, 4]));

        expect(roll.result).toBe(24);
    });

    it("test_a_bonus_die_prefers_ninety_to_a_zero_tens_die_that_would_combine_to_one_hundred", () => {
        // The raw tens dice say 00 is lower than 90, but with a units die of 0 it
        // combines to 100, a fumble. Comparing raw tens would make a bonus die produce
        // the worst result on the table.
        const roll = rollPercentile("bonus", scriptedDice([0, 9, 0]));

        expect(roll.result).toBe(90);
    });

    it("test_an_unmodified_roll_rolls_a_single_tens_die", () => {
        const roll = rollPercentile("none", scriptedDice([3, 7]));

        expect(roll.tens).toEqual([30]);
        expect(roll.result).toBe(37);
    });
});

describe("levels of success", () => {
    it("test_one_is_a_critical_success", () => {
        expect(resolveRoll(1, 60)).toBe("critical");
    });

    it("test_a_hundred_is_a_fumble", () => {
        expect(resolveRoll(100, 60)).toBe("fumble");
    });

    it("test_at_or_below_half_the_value_is_a_hard_success", () => {
        expect(resolveRoll(30, 60)).toBe("hard");
    });

    it("test_half_values_round_down", () => {
        expect(hardThreshold(35)).toBe(17);
        expect(resolveRoll(18, 35)).toBe("regular");
    });

    it("test_at_or_below_the_value_is_a_regular_success", () => {
        expect(resolveRoll(60, 60)).toBe("regular");
    });

    it("test_above_the_value_is_a_failure", () => {
        expect(resolveRoll(61, 60)).toBe("failure");
    });
});

describe("impairment", () => {
    it("test_ninety_is_a_fumble_while_impaired", () => {
        expect(resolveRoll(90, 60, true)).toBe("fumble");
        expect(resolveRoll(90, 60, false)).toBe("failure");
    });

    it("test_an_impaired_fumble_overrides_a_result_that_would_otherwise_succeed", () => {
        // Nafeesa is Bloodied and rolls 95 against Magic 98. The dice are under the
        // skill, but the widened fumble range takes precedence.
        expect(resolveRoll(95, 98, true)).toBe("fumble");
        expect(resolveRoll(95, 98, false)).toBe("regular");
    });

    it("test_eighty_nine_is_still_merely_a_failure_while_impaired", () => {
        expect(resolveRoll(89, 60, true)).toBe("failure");
    });
});

describe("comparing levels for opposed rolls", () => {
    it("test_a_critical_success_beats_a_hard_success", () => {
        expect(compareSuccess("critical", "hard")).toBeGreaterThan(0);
    });

    it("test_a_failure_beats_a_fumble", () => {
        expect(compareSuccess("failure", "fumble")).toBeGreaterThan(0);
    });

    it("test_matching_levels_tie", () => {
        expect(compareSuccess("regular", "regular")).toBe(0);
    });
});

describe("spending Luck", () => {
    it("test_the_book_example_of_stealth_thirty_rolled_at_thirty_four_costs_four_luck", () => {
        // Core book p. 113: Nafeesa rolls 34 against Stealth 30 and spends 4 Luck.
        const options = luckOptions(34, 30);

        expect(options[0]).toEqual({ level: "regular", cost: 4 });
    });

    it("test_every_better_level_is_offered_cheapest_first", () => {
        const options = luckOptions(34, 30);

        expect(options.map((o) => o.level)).toEqual(["regular", "hard", "critical"]);
        expect(options.map((o) => o.cost)).toEqual([4, 19, 33]);
    });

    it("test_a_fumble_cannot_be_bought_off_at_any_price", () => {
        expect(luckOptions(100, 60)).toEqual([]);
    });

    it("test_an_impaired_fumble_cannot_be_bought_off_either", () => {
        expect(luckOptions(92, 98, true)).toEqual([]);
    });

    it("test_a_critical_success_has_nothing_left_to_buy", () => {
        expect(luckOptions(1, 60)).toEqual([]);
    });

    it("test_a_regular_success_can_still_buy_its_way_up_to_hard", () => {
        const options = luckOptions(50, 60);

        expect(options.map((o) => o.level)).toEqual(["hard", "critical"]);
        expect(options[0].cost).toBe(20);
    });
});
