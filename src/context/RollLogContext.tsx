/**
 * The shared roll log: what was rolled, against what, and what it meant.
 *
 * Entries record the *inputs* to the result as well as the result itself (the target
 * value, the modifier, whether the roller was impaired), because a roll log that says
 * only "95, fumble" gives a table no way to tell a widened fumble range from a plain
 * bad roll, and that is exactly the moment someone asks.
 *
 * The log persists to ``localStorage`` so that reopening the popover does not lose the
 * fight so far, and broadcasts a storage event so the separate roll-log window
 * redraws.
 */

import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";
import { withStorageDOMEvents } from "../helper/hooks.ts";
import { createStore } from "zustand/vanilla";
import { DiceModifier, SuccessLevel } from "../rules/types.ts";

/** How many rolls to keep before discarding the oldest. */
const LOG_LIMIT = 100;

/** A single resolved roll, as shown in the log. */
export type RollLogEntryType = {
    uuid: string;
    created_at: string;
    /** The player who rolled, for display. */
    username: string;
    owlbear_user_id?: string;
    /** The token the roll was made for, when it was made from a sheet. */
    tokenName?: string;
    /** What was rolled: a skill name, a characteristic, or a free-text reason. */
    label: string;
    /** The value the roll had to come in at or under. */
    target: number;
    /** Whether a bonus or penalty die applied. */
    modifier: DiceModifier;
    /** Every tens die rolled, so the log can show the die a modifier discarded. */
    tens: number[];
    units: number;
    result: number;
    level: SuccessLevel;
    /** Whether the roller was impaired, which widens the fumble range to 90+. */
    impaired: boolean;
    /** Luck points spent to improve this roll, if any. */
    luckSpent?: number;
    /** The level reached after Luck was spent. */
    levelAfterLuck?: SuccessLevel;
    /** Hidden rolls are shown to the GM alone. */
    is_hidden: boolean;
};

export type RollLogContextType = {
    log: Array<RollLogEntryType>;
    addRoll: (roll: RollLogEntryType) => void;
    /** Record Luck spent against a roll already in the log, rather than adding a new entry. */
    applyLuck: (uuid: string, luckSpent: number, levelAfterLuck: SuccessLevel) => void;
    clear: () => void;
};

export const rollLogStore = createStore<RollLogContextType>()(
    persist<RollLogContextType>(
        (set) => ({
            log: [],
            addRoll: (roll) =>
                set((state) => {
                    if (state.log.find((r) => r.uuid === roll.uuid)) {
                        return state;
                    }
                    const log = [...state.log, roll];
                    if (log.length > LOG_LIMIT) {
                        log.splice(0, log.length - LOG_LIMIT);
                    }
                    window.dispatchEvent(new StorageEvent("storage", { newValue: "new roll", key: `${ID}.roll-log` }));
                    return { ...state, log };
                }),
            applyLuck: (uuid, luckSpent, levelAfterLuck) =>
                set((state) => {
                    const log = state.log.map((entry) =>
                        entry.uuid === uuid ? { ...entry, luckSpent, levelAfterLuck } : entry,
                    );
                    window.dispatchEvent(new StorageEvent("storage", { newValue: "luck spent", key: `${ID}.roll-log` }));
                    return { ...state, log };
                }),
            clear: () => {
                set(() => {
                    window.dispatchEvent(new StorageEvent("storage", { newValue: "clear", key: `${ID}.roll-log` }));
                    return { log: [] };
                });
            },
        }),
        {
            name: `${ID}.roll-log`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export function useRollLogContext(): RollLogContextType;
export function useRollLogContext<T>(selector: (state: RollLogContextType) => T): T;
export function useRollLogContext<T>(selector?: (state: RollLogContextType) => T) {
    return useStore(rollLogStore, selector!);
}

withStorageDOMEvents(rollLogStore);
