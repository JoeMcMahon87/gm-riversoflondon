/**
 * The shapes stored in Owlbear Rodeo item, scene and room metadata.
 *
 * These are storage records, not rules. They round-trip through OBR's metadata
 * unchanged, so they are plain serializable objects: no class instances, no Maps, no
 * undefined where a default would do. The rules that interpret them live in
 * ``src/rules/``, which imports nothing from here.
 *
 * New stored fields default on read, in ``normalizeToken``. There are no migrations.
 */

import { Characteristic, DamageCondition } from "../rules/types.ts";

/** A weapon or unarmed attack a token can use. */
export interface Weapon {
    label: string;
    /** Base damage added to the damage roll's result, before Luck is spent. */
    damage: number;
    /** Whether the damage roll is made against STR (melee) or DEX (ranged). */
    range: "melee" | "ranged";
}

/** A spell a practitioner knows, as it appears on their sheet. */
export interface Spell {
    label: string;
    /** The spell's order, which is its base cost in magic points. */
    order: number;
    /** A mastered spell raises the caster's magic point ceiling by one and can be boosted. */
    mastered: boolean;
}

/** A named skill and its percentage value. */
export interface Skill {
    label: string;
    value: number;
    /**
     * An expert skill nobody in the group has can still be attempted by Trying Your
     * Luck, so the UI offers that path only for skills flagged here.
     */
    expert: boolean;
}

/**
 * Damage taken so far in the current fight.
 *
 * ``largestBlow`` is tracked alongside the total because the two worst conditions are
 * defined by a single blow rather than by the total: four damage in one hit is a mortal
 * wound, while four accumulated across four hits is merely Down.
 */
export interface DamageState {
    total: number;
    largestBlow: number;
    /** Whether the 30 Luck that reduces a fatal blow to a mortal wound was paid. */
    luckSpentOnFatalBlow: boolean;
}

/**
 * Everything the extension stores against a single token.
 *
 * Magic point and condition *maxima* are deliberately absent: both are derived from
 * POW and the mastered spell count by ``src/rules/``, and storing a copy is how a sheet
 * comes to disagree with itself.
 */
export interface RoLMetadata {
    active: boolean;
    isPlayer: boolean;
    showOnMap: boolean;
    characteristics: Record<Characteristic, number>;
    skills: Skill[];
    spells: Spell[];
    weapons: Weapon[];
    damage: DamageState;
    luck: { current: number; starting: number };
    magicPoints: { current: number };
    mov: number;
    /**
     * A condition set by hand, overriding the one derived from damage.
     *
     * Needed because conditions have causes other than combat damage: a GM can mark an
     * NPC impaired by mental trauma without inventing damage to explain it.
     */
    conditionOverride: DamageCondition | null;
    notes: string;
    index?: number;
    group?: string;
}

/** Marks an item as a map attachment this extension created, so it can be cleaned up. */
export interface AttachmentMetadata {
    rolAttachment: boolean;
}

/** Per-scene settings, including the token group ordering. */
export interface SceneMetadata {
    version?: string;
    id?: string;
    groups?: string[];
    openGroups?: string[];
}

/** Per-room settings shared by everyone at the table. */
export interface RoomMetadata {
    ignoreUpdateNotification?: boolean;
    /** Show players the level of success on a roll, rather than only the number. */
    revealSuccessLevel?: boolean;
}

/** The subset of an OBR item this extension changes when drawing map attachments. */
export interface ItemChanges {
    width?: number;
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
}
