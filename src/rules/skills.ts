/**
 * The skill list, and the starting values character creation gives it.
 *
 * Only skill *names* and their category live here, with no descriptive text from the
 * rulebook: enough to build a sheet without transcribing anyone's prose. Specialised
 * skills are stored as a bare stem ("Science", "Art/Craft", "Languages") because the
 * specialisation is per character, and a sheet holds "Science (Chemistry)" rather than
 * a generic "Science" the rules do not allow anyone to take.
 *
 * Adding a skill means adding an entry to one of the arrays below, never a new branch
 * in a component.
 *
 * A leaf module: it imports only from ``./types``, and nothing from Owlbear Rodeo.
 */

/** How a skill behaves at character creation and in play. */
export type SkillCategory = "common" | "expert" | "combat";

/** A skill as the rules define it, before a character assigns it a value. */
export interface SkillDefinition {
    label: string;
    category: SkillCategory;
    /**
     * Whether the skill must be taken with a specialisation, as Science, Art/Craft and
     * Languages are. The sheet asks for the bracketed part when this is set.
     */
    specialised?: boolean;
}

/** A chosen common skill starts at 60% (core book p. 81). */
export const CHOSEN_COMMON_SKILL_VALUE = 60;

/** An unchosen common skill still starts at 30%, which is why every investigator can try one. */
export const BASE_COMMON_SKILL_VALUE = 30;

/** Creation picks six starting skills (core book p. 52). */
export const STARTING_SKILL_COUNT = 6;

/**
 * The nine common skills every investigator can use untrained.
 *
 * These are the skills that appear on every sheet whether or not they were chosen, so
 * the roller always has something to offer.
 */
export const COMMON_SKILLS: readonly SkillDefinition[] = [
    { label: "Athletics", category: "common" },
    { label: "Drive", category: "common" },
    { label: "Navigate", category: "common" },
    { label: "Observation", category: "common" },
    { label: "Read Person", category: "common" },
    { label: "Research", category: "common" },
    { label: "Sense Vestigia", category: "common" },
    { label: "Social", category: "common" },
    { label: "Stealth", category: "common" },
] as const;

/** The two combat skills. */
export const COMBAT_SKILLS: readonly SkillDefinition[] = [
    { label: "Fighting", category: "combat" },
    { label: "Firearms", category: "combat" },
] as const;

/**
 * The expert skills.
 *
 * An investigator only has the ones they took. Anyone else attempting one needs Trying
 * Your Luck, which is why ``Skill.expert`` is tracked per token.
 */
export const EXPERT_SKILLS: readonly SkillDefinition[] = [
    { label: "Accounting", category: "expert" },
    { label: "Animal Handling", category: "expert" },
    { label: "Appraise", category: "expert" },
    { label: "Art/Craft", category: "expert", specialised: true },
    { label: "Computer Use", category: "expert" },
    { label: "Demolitions", category: "expert" },
    { label: "Disguise", category: "expert" },
    { label: "Diving", category: "expert" },
    { label: "History", category: "expert" },
    { label: "Languages", category: "expert", specialised: true },
    { label: "Law", category: "expert" },
    { label: "Locksmith", category: "expert" },
    { label: "Magic", category: "expert" },
    { label: "Mechanical Repair", category: "expert" },
    { label: "Medicine", category: "expert" },
    { label: "Occult", category: "expert" },
    { label: "Pilot Aircraft", category: "expert" },
    { label: "Pilot Boat", category: "expert" },
    { label: "Read Lips", category: "expert" },
    { label: "Ride", category: "expert" },
    { label: "Science", category: "expert", specialised: true },
    { label: "Sleight of Hand", category: "expert" },
    { label: "Survival", category: "expert" },
    { label: "Tech", category: "expert" },
    { label: "Track", category: "expert" },
] as const;

/** Every skill the rules name, in sheet order. */
export const ALL_SKILLS: readonly SkillDefinition[] = [...COMMON_SKILLS, ...COMBAT_SKILLS, ...EXPERT_SKILLS];

/**
 * The band a skill value falls into (core book p. 79).
 *
 * Purely descriptive: no rule keys off the band, but it tells a GM at a glance whether
 * an NPC's 45% in Forensics is a hobby or a job.
 */
export type SkillBand = "amateur" | "professional" | "expert" | "master";

/** Describe a skill value as Amateur, Professional, Expert or Master. */
export const skillBand = (value: number): SkillBand => {
    if (value >= 90) {
        return "master";
    }
    if (value >= 70) {
        return "expert";
    }
    if (value >= 50) {
        return "professional";
    }
    return "amateur";
};

/**
 * Build the skill block a new investigator sheet starts with.
 *
 * Every common skill is present whether or not it was chosen, because an unchosen
 * common skill is still rollable at 30%. Expert skills are omitted unless chosen: an
 * expert skill nobody has is not a 30% roll, it is a Trying Your Luck problem.
 *
 * Args:
 *     chosen: Labels of the skills taken at creation. Common skills named here start
 *         at 60% instead of 30%; expert and combat skills named here are added at 60%.
 *
 * Returns:
 *     The starting skills, in sheet order.
 */
export const startingSkills = (chosen: readonly string[] = []): Array<{ label: string; value: number; expert: boolean }> => {
    const picked = new Set(chosen);

    const common = COMMON_SKILLS.map((skill) => ({
        label: skill.label,
        value: picked.has(skill.label) ? CHOSEN_COMMON_SKILL_VALUE : BASE_COMMON_SKILL_VALUE,
        expert: false,
    }));

    const specialist = [...COMBAT_SKILLS, ...EXPERT_SKILLS]
        .filter((skill) => picked.has(skill.label))
        .map((skill) => ({
            label: skill.label,
            value: CHOSEN_COMMON_SKILL_VALUE,
            expert: skill.category === "expert",
        }));

    return [...common, ...specialist];
};
