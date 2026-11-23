/**
 * Make a roll, resolve it, and tell the rest of the table about it.
 *
 * This is the seam between the pure rules in ``src/rules/`` and Owlbear Rodeo. The
 * rules decide what a result means; this module decides who gets told. Keeping the
 * broadcast here is what allows ``resolveRoll`` to stay testable without a room to
 * broadcast into.
 */

import OBR from "@owlbear-rodeo/sdk";
import { v4 as uuidv4 } from "uuid";
import { rollMessageChannel } from "./variables.ts";
import { RollLogEntryType, rollLogStore } from "../context/RollLogContext.tsx";
import { luckOptions, resolveRoll, rollPercentile } from "../rules/roll.ts";
import { DiceModifier, SuccessLevel } from "../rules/types.ts";

/** What a caller needs to supply to make a roll. */
export interface RollRequest {
    /** What is being rolled: a skill name, a characteristic, or a free-text reason. */
    label: string;
    /** The value the result must come in at or under. */
    target: number;
    modifier?: DiceModifier;
    /** Whether the roller is impaired, which widens the fumble range to 90 and above. */
    impaired?: boolean;
    /** The token the roll belongs to, for the log. */
    tokenName?: string;
    /** A hidden roll is shown to the GM alone, for a secret Sense Vestigia check. */
    hidden?: boolean;
    username: string;
    playerId?: string;
}

/** How a roll turned out, and what Luck could still do about it. */
export interface RollOutcome {
    entry: RollLogEntryType;
    /** Each better level of success Luck could buy, cheapest first. Empty on a fumble. */
    luck: ReturnType<typeof luckOptions>;
}

/**
 * Roll against a target, log the result, and broadcast it to the room.
 *
 * A broadcast failure is caught and logged rather than propagated: the roll has already
 * happened and the roller can see it, so failing the whole action because the other
 * players' logs did not update would be worse than the missing line.
 *
 * Args:
 *     request: What to roll and on whose behalf.
 *
 * Returns:
 *     The logged entry and the Luck options still open on it.
 */
export const makeRoll = async (request: RollRequest): Promise<RollOutcome> => {
    const modifier = request.modifier ?? "none";
    const impaired = request.impaired ?? false;
    const roll = rollPercentile(modifier);
    const level = resolveRoll(roll.result, request.target, impaired);

    const entry: RollLogEntryType = {
        uuid: uuidv4(),
        created_at: new Date().toISOString(),
        username: request.username,
        owlbear_user_id: request.playerId,
        tokenName: request.tokenName,
        label: request.label,
        target: request.target,
        modifier,
        tens: roll.tens,
        units: roll.units,
        result: roll.result,
        level,
        impaired,
        is_hidden: request.hidden ?? false,
    };

    rollLogStore.getState().addRoll(entry);

    if (!entry.is_hidden) {
        try {
            await OBR.broadcast.sendMessage(rollMessageChannel, entry, { destination: "REMOTE" });
        } catch (e) {
            console.warn("GM's Rivers of London: roll was made but could not be broadcast", e);
        }
    }

    return { entry, luck: luckOptions(roll.result, request.target, impaired) };
};

/**
 * Record Luck spent to improve a roll that has already been made.
 *
 * The original roll stays in the log with the improvement noted against it, rather than
 * being replaced, so the table can still see what the dice actually did.
 */
export const applyLuckToRoll = async (uuid: string, luckSpent: number, levelAfterLuck: SuccessLevel) => {
    rollLogStore.getState().applyLuck(uuid, luckSpent, levelAfterLuck);
    const entry = rollLogStore.getState().log.find((e) => e.uuid === uuid);
    if (!entry || entry.is_hidden) {
        return;
    }
    try {
        await OBR.broadcast.sendMessage(rollMessageChannel, entry, { destination: "REMOTE" });
    } catch (e) {
        console.warn("GM's Rivers of London: Luck was spent but could not be broadcast", e);
    }
};

/** How a level of success reads in the log and on a button. */
export const SUCCESS_LABEL: Record<SuccessLevel, string> = {
    critical: "Critical success",
    hard: "Hard success",
    regular: "Regular success",
    failure: "Failure",
    fumble: "Fumble",
};

/** Start listening for other players' rolls so they appear in this window's log. */
export const subscribeToRolls = () =>
    OBR.broadcast.onMessage(rollMessageChannel, (event) => {
        rollLogStore.getState().addRoll(event.data as RollLogEntryType);
    });
