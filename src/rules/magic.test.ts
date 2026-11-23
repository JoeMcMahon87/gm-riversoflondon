/** Spellcasting costs and Hyperthaumaturgical Degradation. */

import { describe, expect, it } from "vitest";
import { DEGRADATION_TABLE, degradationPenaltyDie, spellCost, willDegradeOnCast } from "./magic.ts";
import { conditionFor } from "./damage.ts";

describe("magic point costs", () => {
    it("test_the_base_cost_of_a_spell_is_its_order", () => {
        expect(spellCost(2)).toBe(2);
    });

    it("test_boosting_adds_to_the_base_cost", () => {
        expect(spellCost(2, 3)).toBe(5);
    });
});

describe("casting on empty", () => {
    it("test_a_practitioner_with_no_magic_points_degrades_on_every_attempt", () => {
        expect(willDegradeOnCast(0)).toBe(true);
    });

    it("test_a_practitioner_with_points_left_casts_normally", () => {
        expect(willDegradeOnCast(1)).toBe(false);
    });
});

describe("the Hyperthaumaturgical Degradation table", () => {
    it("test_every_outcome_drains_the_caster_completely_even_a_critical_success", () => {
        const outcomes = Object.values(DEGRADATION_TABLE);

        expect(outcomes.every((o) => o.magicPointsRemaining === 0)).toBe(true);
    });

    it("test_a_critical_success_costs_no_damage", () => {
        expect(DEGRADATION_TABLE.critical.damage).toBe(0);
    });

    it("test_a_plain_failure_is_a_mortal_wound", () => {
        expect(DEGRADATION_TABLE.failure.damage).toBe(4);
        expect(conditionFor(4, DEGRADATION_TABLE.failure.damage)).toBe("mortally-wounded");
    });

    it("test_a_fumble_is_a_fatal_blow_that_kills_without_thirty_luck", () => {
        const damage = DEGRADATION_TABLE.fumble.damage;

        expect(damage).toBe(5);
        expect(conditionFor(damage, damage)).toBe("dead");
        expect(conditionFor(damage, damage, true)).toBe("mortally-wounded");
    });

    it("test_the_outcomes_worsen_monotonically_down_the_ladder", () => {
        expect(DEGRADATION_TABLE.critical.damage).toBeLessThan(DEGRADATION_TABLE.hard.damage);
        expect(DEGRADATION_TABLE.hard.damage).toBeLessThan(DEGRADATION_TABLE.regular.damage);
        expect(DEGRADATION_TABLE.regular.damage).toBeLessThan(DEGRADATION_TABLE.failure.damage);
        expect(DEGRADATION_TABLE.failure.damage).toBeLessThan(DEGRADATION_TABLE.fumble.damage);
    });
});

describe("the penalty die on the POW roll", () => {
    it("test_only_a_fumbled_pushed_casting_incurs_the_penalty_die", () => {
        expect(degradationPenaltyDie("failed-pushed-casting", true)).toBe(true);
    });

    it("test_a_pushed_casting_that_merely_failed_incurs_no_penalty_die", () => {
        expect(degradationPenaltyDie("failed-pushed-casting", false)).toBe(false);
    });

    it("test_an_ordinary_fumbled_casting_incurs_no_penalty_die", () => {
        expect(degradationPenaltyDie("fumbled-casting", true)).toBe(false);
    });

    it("test_casting_while_empty_incurs_no_penalty_die", () => {
        expect(degradationPenaltyDie("cast-while-empty", true)).toBe(false);
    });
});
