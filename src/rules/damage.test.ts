/** Reading a damage condition off accumulated damage, and an attack's damage off its roll. */

import { describe, expect, it } from "vitest";
import { conditionFor, damageFor, isImpaired, isIncapacitated } from "./damage.ts";

describe("the damage condition track", () => {
    it("test_an_untouched_character_is_healthy", () => {
        expect(conditionFor(0)).toBe("healthy");
    });

    it("test_one_point_leaves_a_character_hurt", () => {
        expect(conditionFor(1, 1)).toBe("hurt");
    });

    it("test_two_points_leave_a_character_bloodied", () => {
        expect(conditionFor(2, 1)).toBe("bloodied");
    });

    it("test_three_points_leave_a_character_down", () => {
        expect(conditionFor(3, 1)).toBe("down");
    });

    it("test_damage_accumulates_across_the_whole_fight_rather_than_per_attack", () => {
        expect(conditionFor(3, 1)).toBe("down");
    });
});

describe("the worst two conditions come from a single blow, not the total", () => {
    it("test_four_damage_in_one_blow_is_a_mortal_wound", () => {
        expect(conditionFor(4, 4)).toBe("mortally-wounded");
    });

    it("test_four_damage_ground_down_across_four_attacks_is_only_down", () => {
        // The distinction that makes largestBlow a separate argument: Jules taking four
        // single-point knocks is Down, while one four-point blow is Mortally Wounded.
        expect(conditionFor(4, 1)).toBe("down");
    });

    it("test_five_damage_in_one_blow_kills_outright_when_no_luck_is_spent", () => {
        expect(conditionFor(5, 5)).toBe("dead");
    });

    it("test_thirty_luck_reduces_a_fatal_blow_to_a_mortal_wound", () => {
        expect(conditionFor(5, 5, true)).toBe("mortally-wounded");
    });
});

describe("what a condition does to a character", () => {
    it("test_hurt_carries_no_mechanical_effect", () => {
        expect(isImpaired("hurt")).toBe(false);
        expect(isIncapacitated("hurt")).toBe(false);
    });

    it("test_bloodied_impairs_but_does_not_incapacitate", () => {
        expect(isImpaired("bloodied")).toBe(true);
        expect(isIncapacitated("bloodied")).toBe(false);
    });

    it("test_down_both_impairs_and_incapacitates", () => {
        expect(isImpaired("down")).toBe(true);
        expect(isIncapacitated("down")).toBe(true);
    });
});

describe("the damage roll", () => {
    it("test_a_critical_success_adds_three_to_the_weapon_damage", () => {
        expect(damageFor("critical", 2)).toBe(5);
    });

    it("test_a_hard_success_adds_two_to_the_weapon_damage", () => {
        expect(damageFor("hard", 2)).toBe(4);
    });

    it("test_a_regular_success_adds_one_to_the_weapon_damage", () => {
        expect(damageFor("regular", 2)).toBe(3);
    });

    it("test_a_failed_damage_roll_still_does_one_damage_but_drops_the_weapon_bonus", () => {
        expect(damageFor("failure", 2)).toBe(1);
    });

    it("test_a_fumbled_damage_roll_also_does_one_damage", () => {
        expect(damageFor("fumble", 2)).toBe(1);
    });

    it("test_an_unarmed_regular_success_does_a_single_point", () => {
        expect(damageFor("regular")).toBe(1);
    });
});
