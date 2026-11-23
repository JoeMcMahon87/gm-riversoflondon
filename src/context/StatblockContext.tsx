/**
 * The GM's saved statblock library.
 *
 * Stored in ``localStorage`` rather than in room or scene metadata, deliberately: a
 * library of NPCs is the GM's own prep and should follow them from one room to the
 * next, rather than being trapped in the scene it was first typed into. The cost is
 * that it lives in one browser and is not shared with players, which for adversary
 * statistics is the behavior you want anyway.
 *
 * No statblock ships with this extension. Rivers of London's creature and NPC profiles
 * are Chaosium's, so the library starts empty and the GM fills it from their own copy.
 */

import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { ID } from "../helper/variables.ts";
import { RoLMetadata, Skill, Spell, Weapon } from "../helper/types.ts";
import { Characteristic } from "../rules/types.ts";

/**
 * A saved statblock: the parts of a sheet that describe who someone is.
 *
 * Damage, Luck and magic points are deliberately excluded. Those describe how a
 * particular fight is going, not the character, and applying a statblock should never
 * silently heal or wound the token it is applied to.
 */
export interface Statblock {
    name: string;
    characteristics: Record<Characteristic, number>;
    skills: Skill[];
    spells: Spell[];
    weapons: Weapon[];
    mov: number;
    notes: string;
}

export type StatblockContextType = {
    statblocks: Statblock[];
    save: (statblock: Statblock) => void;
    remove: (name: string) => void;
};

export const statblockStore = createStore<StatblockContextType>()(
    persist<StatblockContextType>(
        (set) => ({
            statblocks: [],
            // Saving under an existing name replaces it, so correcting a statblock is
            // the same gesture as creating one.
            save: (statblock) =>
                set((state) => ({
                    ...state,
                    statblocks: [...state.statblocks.filter((s) => s.name !== statblock.name), statblock].sort((a, b) =>
                        a.name.localeCompare(b.name),
                    ),
                })),
            remove: (name) =>
                set((state) => ({ ...state, statblocks: state.statblocks.filter((s) => s.name !== name) })),
        }),
        {
            name: `${ID}.statblocks`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export function useStatblockContext(): StatblockContextType;
export function useStatblockContext<T>(selector: (state: StatblockContextType) => T): T;
export function useStatblockContext<T>(selector?: (state: StatblockContextType) => T) {
    return useStore(statblockStore, selector!);
}

/** Capture a token's current sheet as a reusable statblock. */
export const statblockFromToken = (name: string, data: RoLMetadata): Statblock => ({
    name,
    characteristics: { ...data.characteristics },
    skills: data.skills.map((s) => ({ ...s })),
    spells: data.spells.map((s) => ({ ...s })),
    weapons: data.weapons.map((w) => ({ ...w })),
    mov: data.mov,
    notes: data.notes,
});

/**
 * Apply a statblock to a token's record.
 *
 * Everything the statblock does not describe is carried through untouched, so applying
 * a statblock to a token already in a fight keeps its damage, its group and its map
 * setting.
 */
export const applyStatblock = (statblock: Statblock, data: RoLMetadata): RoLMetadata => ({
    ...data,
    characteristics: { ...statblock.characteristics },
    skills: statblock.skills.map((s) => ({ ...s })),
    spells: statblock.spells.map((s) => ({ ...s })),
    weapons: statblock.weapons.map((w) => ({ ...w })),
    mov: statblock.mov,
    notes: statblock.notes,
});
