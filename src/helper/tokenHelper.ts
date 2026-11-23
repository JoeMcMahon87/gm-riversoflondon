/**
 * Write changes back to a token's stored record.
 *
 * Every mutation the sheet performs goes through this module, so that the three things
 * that must happen together always do: the item metadata is written, the map
 * attachment is redrawn, and large selections are updated in batches rather than one
 * call per token. A component that wrote ``item.metadata`` directly would skip the
 * redraw and leave the map showing a stale condition.
 */

import { RoLMetadata } from "./types.ts";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "./variables.ts";
import { updateItems, updateList } from "./obrHelper.ts";
import { isObject } from "lodash";
import { updateAttachments } from "./attachmentHelpers.ts";
import { evalString } from "./helpers.ts";
import { magicPointMax } from "../rules/characteristics.ts";

/** Owlbear Rodeo rejects oversized batches, so selections are written in chunks of this size. */
const UPDATE_CHUNK_SIZE = 16;

/** Describe a caught Owlbear Rodeo error without assuming its shape. */
const errorName = (e: unknown): string =>
    isObject(e) && "error" in e && isObject(e.error) && "name" in e.error ? String(e.error.name) : "Undefined Error";

/**
 * Write a record to every listed token and redraw their map attachments.
 *
 * A failure to update the attachments is logged and swallowed: the sheet is the primary
 * record, and losing a label on the map is not worth failing the whole edit over.
 */
export const updateTokenMetadata = async (tokenData: RoLMetadata, ids: Array<string>) => {
    try {
        await updateList(ids, UPDATE_CHUNK_SIZE, async (subList) => {
            await updateItems(subList, (items: Array<Item>) => {
                items.forEach((item) => {
                    item.metadata[itemMetadataKey] = { ...tokenData };
                });
            });
        });
    } catch (e) {
        console.warn(`GM's Rivers of London: error updating ${ids.length} tokens: ${errorName(e)}`);
    }

    try {
        const items = await OBR.scene.items.getItems(ids);
        for (const item of items) {
            await updateAttachments(item, tokenData);
        }
    } catch (e) {
        console.warn(`GM's Rivers of London: error updating attachments for ${ids.length} tokens: ${errorName(e)}`);
    }
};

/**
 * Read a number out of a text input, accepting relative arithmetic.
 *
 * Typing "+2" into the damage box is how a GM actually works during a fight, so an
 * input containing a sign is evaluated against the current value rather than replacing
 * it.
 *
 * Args:
 *     input: Whatever the user typed.
 *     current: The value the field held before the edit, used as the base for a
 *         relative change.
 *
 * Returns:
 *     The new value, never below zero.
 */
export const readNumericInput = (input: string, current: number): number => {
    const relative = input.trim().startsWith("+") || input.trim().startsWith("-");
    const value = relative ? current + Number(evalString(input)) : Number(input.replace(/[^0-9]/g, ""));
    return Math.max(Number.isNaN(value) ? current : value, 0);
};

/**
 * Apply damage from a single blow.
 *
 * The blow's size is recorded separately from the running total because a mortal wound
 * and a fatal blow are defined by one blow rather than by the total, and that
 * distinction cannot be recovered from the total afterwards.
 */
export const applyDamage = async (blow: number, data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = {
        ...data,
        damage: {
            ...data.damage,
            total: Math.max(data.damage.total + blow, 0),
            largestBlow: Math.max(data.damage.largestBlow, blow),
        },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/**
 * Set the running damage total by hand, leaving the largest blow alone.
 *
 * Used when a GM is correcting a miscount rather than resolving an attack, which is why
 * it does not touch ``largestBlow``: editing the total should not silently upgrade
 * someone to a mortal wound.
 */
export const setDamageTotal = async (total: number, data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = {
        ...data,
        damage: { ...data.damage, total: Math.max(total, 0) },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/**
 * Clear all damage, as happens when a fight ends and wounds are healed.
 *
 * Also clears ``largestBlow`` and the fatal-blow Luck flag: both describe a fight that
 * is now over, and carrying them into the next one would misreport the condition.
 */
export const clearDamage = async (data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = {
        ...data,
        damage: { total: 0, largestBlow: 0, luckSpentOnFatalBlow: false },
        conditionOverride: null,
    };
    await updateTokenMetadata(newData, [item.id]);
};

/** Record that the investigator paid the 30 Luck that turns a fatal blow into a mortal wound. */
export const spendLuckOnFatalBlow = async (data: RoLMetadata, item: Image, cost: number) => {
    const newData: RoLMetadata = {
        ...data,
        damage: { ...data.damage, luckSpentOnFatalBlow: true },
        luck: { ...data.luck, current: Math.max(data.luck.current - cost, 0) },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/** Spend Luck points, never taking the pool below zero. */
export const spendLuck = async (cost: number, data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = {
        ...data,
        luck: { ...data.luck, current: Math.max(data.luck.current - cost, 0) },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/** Set the current Luck pool directly. */
export const setLuck = async (value: number, data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = { ...data, luck: { ...data.luck, current: Math.max(value, 0) } };
    await updateTokenMetadata(newData, [item.id]);
};

/**
 * Spend magic points on a casting.
 *
 * The pool stops at zero rather than going negative. A practitioner may keep casting
 * past empty, but the rules track that with a Hyperthaumaturgical Degradation roll
 * instead of with negative points, so there is nothing below zero to record.
 */
export const spendMagicPoints = async (cost: number, data: RoLMetadata, item: Image) => {
    const newData: RoLMetadata = {
        ...data,
        magicPoints: { current: Math.max(data.magicPoints.current - cost, 0) },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/** Set the current magic point pool directly, capped at the practitioner's maximum. */
export const setMagicPoints = async (value: number, data: RoLMetadata, item: Image) => {
    const max = magicPointMax(data.characteristics.POW, data.spells.filter((s) => s.mastered).length);
    const newData: RoLMetadata = {
        ...data,
        magicPoints: { current: Math.min(Math.max(value, 0), max) },
    };
    await updateTokenMetadata(newData, [item.id]);
};

/**
 * Refill magic points, as they do naturally for the next scene.
 *
 * The maximum is recalculated rather than read from storage, so mastering a spell
 * raises the ceiling the first time the caster rests.
 */
export const restoreMagicPoints = async (data: RoLMetadata, item: Image) => {
    const max = magicPointMax(data.characteristics.POW, data.spells.filter((s) => s.mastered).length);
    const newData: RoLMetadata = { ...data, magicPoints: { current: max } };
    await updateTokenMetadata(newData, [item.id]);
};

/** Set, or clear with ``null``, a condition that overrides the one derived from damage. */
export const setConditionOverride = async (
    condition: RoLMetadata["conditionOverride"],
    data: RoLMetadata,
    item: Image,
) => {
    await updateTokenMetadata({ ...data, conditionOverride: condition }, [item.id]);
};
