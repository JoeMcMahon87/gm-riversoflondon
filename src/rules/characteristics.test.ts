/** Values the character sheet derives from its five characteristics. */

import { describe, expect, it } from "vitest";
import { halfValue, magicPointMax, rollStartingLuck, validateCharacteristics } from "./characteristics.ts";

describe("half values", () => {
    it("test_the_sheets_worked_example_of_strength_forty_halving_to_twenty", () => {
        expect(halfValue(40)).toBe(20);
    });

    it("test_an_odd_value_rounds_down", () => {
        expect(halfValue(35)).toBe(17);
    });
});

describe("magic points", () => {
    it("test_magic_points_are_one_fifth_of_pow", () => {
        expect(magicPointMax(50)).toBe(10);
    });

    it("test_each_mastered_spell_raises_the_ceiling_by_one", () => {
        // Nafeesa has POW 60 and has mastered Werelight: 12 base, plus 1.
        expect(magicPointMax(60, 1)).toBe(13);
    });

    it("test_a_pow_that_does_not_divide_by_five_rounds_down", () => {
        expect(magicPointMax(58)).toBe(11);
    });
});

describe("starting Luck", () => {
    it("test_the_lowest_possible_starting_luck_is_fifty_two", () => {
        expect(rollStartingLuck(() => 0)).toBe(52);
    });

    it("test_the_highest_possible_starting_luck_is_seventy", () => {
        expect(rollStartingLuck(() => 9)).toBe(70);
    });
});

describe("validating a creation spread", () => {
    it("test_a_legal_spread_totalling_two_hundred_and_eighty_reports_no_problems", () => {
        expect(validateCharacteristics({ STR: 50, CON: 60, DEX: 60, INT: 60, POW: 50 })).toEqual([]);
    });

    it("test_a_spread_that_does_not_total_two_hundred_and_eighty_is_rejected", () => {
        const problems = validateCharacteristics({ STR: 30, CON: 30, DEX: 30, INT: 30, POW: 30 });

        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain("150");
    });

    it("test_a_characteristic_above_eighty_is_rejected", () => {
        const problems = validateCharacteristics({ STR: 90, CON: 50, DEX: 50, INT: 50, POW: 40 });

        expect(problems.some((p) => p.startsWith("STR"))).toBe(true);
    });

    it("test_a_characteristic_not_in_a_block_of_ten_is_rejected", () => {
        const problems = validateCharacteristics({ STR: 55, CON: 55, DEX: 60, INT: 60, POW: 50 });

        expect(problems.some((p) => p.includes("blocks of 10"))).toBe(true);
    });
});
