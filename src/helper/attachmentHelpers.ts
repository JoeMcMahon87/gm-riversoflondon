/**
 * Draw a token's damage condition on the map, beneath the token itself.
 *
 * Daggerheart drew a depleting HP bar here. Rivers of London has no bar to draw: a
 * character is in one of six named conditions, so the attachment is a short label
 * ("Bloodied 2") rather than a fraction of a rectangle. A healthy token draws nothing
 * at all, which keeps a map of untouched NPCs clean instead of lining it with full
 * bars that carry no information.
 *
 * Attachments are marked with ``infoMetadataKey`` so this extension can find and remove
 * its own and leave everyone else's alone.
 */

import { buildShape, buildText, Image, Item, Text } from "@owlbear-rodeo/sdk";
import { ItemChanges, RoLMetadata } from "./types.ts";
import { deleteAttachments, getAttachedItems, getImageBounds } from "./helpers.ts";
import { infoMetadataKey, itemMetadataKey } from "./variables.ts";
import { addItems, updateItems } from "./obrHelper.ts";
import { conditionFor } from "../rules/damage.ts";
import { DamageCondition } from "../rules/types.ts";

/** The label drawn on the map for each condition. Healthy draws nothing. */
const CONDITION_LABEL: Record<DamageCondition, string> = {
    healthy: "",
    hurt: "Hurt",
    bloodied: "Bloodied",
    down: "Down",
    "mortally-wounded": "Mortal Wound",
    dead: "Dead",
};

/**
 * The colour of each condition's label, darkening as the condition worsens.
 *
 * Chosen to stay legible against both light and dark battle maps, which is why every
 * one of them is paired with a black stroke below rather than relying on fill alone.
 */
const CONDITION_COLOR: Record<DamageCondition, string> = {
    healthy: "white",
    hurt: "#e8d44d",
    bloodied: "#e08b3a",
    down: "#d14343",
    "mortally-wounded": "#a01f1f",
    dead: "#9a9a9a",
};

/** The attachment's name, used to find it again on a later update. */
const CONDITION_TEXT = "rol-condition-text";

/** The name of the backing plate drawn behind the label. */
const CONDITION_PLATE = "rol-condition-plate";

/**
 * The condition a token is currently in, honoring a hand-set override.
 *
 * A GM can mark an NPC impaired for reasons combat damage cannot express, so the
 * override wins over the derived condition wherever it is set.
 */
export const currentCondition = (data: RoLMetadata): DamageCondition =>
    data.conditionOverride ??
    conditionFor(data.damage.total, data.damage.largestBlow, data.damage.luckSpentOnFatalBlow);

/**
 * The text drawn under a token.
 *
 * The running damage total is appended to the condition because the condition alone
 * cannot distinguish a character one point from going Down from one who just arrived
 * there.
 */
export const conditionLabel = (data: RoLMetadata): string => {
    const condition = currentCondition(data);
    if (condition === "healthy") {
        return "";
    }
    return data.damage.total > 0 ? `${CONDITION_LABEL[condition]} ${data.damage.total}` : CONDITION_LABEL[condition];
};

/**
 * Whether this token's condition should currently be drawn on the map.
 *
 * Hidden tokens and healthy tokens draw nothing. Only player tokens are shown to the
 * whole table; an NPC's condition stays in the GM's list, since telling the players a
 * creature is Bloodied is the GM's call to make out loud.
 */
const shouldShow = (token: Item, data: RoLMetadata): boolean =>
    token.visible && data.isPlayer && currentCondition(data) !== "healthy";

/** Build the label and its backing plate for a token. */
export const createAttachments = async (token: Image, data: RoLMetadata): Promise<Item[]> => {
    const bounds = await getImageBounds(token);
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const width = Math.abs(bounds.width);
    const overflow = 100;
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width : bounds.position.x,
        y: bounds.position.y + bounds.height - height - bounds.height / 10,
    };
    const condition = currentCondition(data);
    const visible = shouldShow(token, data);

    const plate = buildShape()
        .width(width)
        .height(height)
        .shapeType("RECTANGLE")
        .fillColor("black")
        .fillOpacity(0.5)
        .strokeColor("black")
        .strokeOpacity(0)
        .position(position)
        .attachedTo(token.id)
        .layer(token.layer)
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(visible)
        .name(CONDITION_PLATE)
        .zIndex(token.zIndex + 1)
        .build();

    const label = buildText()
        .textType("PLAIN")
        .width(width + overflow)
        .height(height)
        .position({
            x: bounds.width < 0 ? bounds.position.x + bounds.width - overflow / 2 : bounds.position.x - overflow / 2,
            y: position.y,
        })
        .attachedTo(token.id)
        .layer(token.layer)
        .plainText(conditionLabel(data))
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .fillColor(CONDITION_COLOR[condition])
        .strokeColor("black")
        .strokeWidth(2)
        .fontSize(height)
        .lineHeight(1)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(visible)
        .name(CONDITION_TEXT)
        .zIndex(token.zIndex + 4)
        .build();

    plate.metadata[infoMetadataKey] = { rolAttachment: true, attachmentType: "CONDITION" };
    label.metadata[infoMetadataKey] = { rolAttachment: true, attachmentType: "CONDITION" };

    return [plate, label];
};

/**
 * Bring a token's existing attachments in line with its data, or create them.
 *
 * Changes are collected into ``changes`` rather than written here so that a caller
 * updating many tokens can send one batch to Owlbear Rodeo instead of one call per
 * attachment.
 */
export const saveOrChangeAttachments = async (
    token: Item,
    data: RoLMetadata,
    attachments: Array<Item>,
    changes: Map<string, ItemChanges>,
) => {
    if (attachments.length === 0) {
        await addItems(await createAttachments(token as Image, data));
        return;
    }

    const visible = shouldShow(token, data);
    for (const attachment of attachments) {
        const change = changes.get(attachment.id) ?? {};
        if (attachment.name === CONDITION_TEXT) {
            const text = conditionLabel(data);
            if ((attachment as Text).text.plainText !== text) {
                change.text = text;
            }
        }
        if (attachment.visible !== visible) {
            change.visible = visible;
        }
        changes.set(attachment.id, change);
    }
};

/** Hide or show every token's attachments after a visibility change. */
export const updateAttachmentVisibility = async (tokens: Array<Item>) => {
    const changes = new Map<string, ItemChanges>();
    for (const token of tokens) {
        const attachments = await getAttachedItems(token.id, []);
        const data = token.metadata[itemMetadataKey] as RoLMetadata;
        const visible = shouldShow(token, data);

        attachments.forEach((item) => {
            if (item.visible !== visible) {
                changes.set(item.id, { ...(changes.get(item.id) ?? {}), visible });
            }
        });
    }
    await updateAttachmentChanges(changes);
};

/** Redraw, or remove, the attachments of a single token after its data changed. */
export const updateAttachments = async (item: Item, data: RoLMetadata) => {
    const attachments = await getAttachedItems(item.id, []);
    const attachmentChanges = new Map<string, ItemChanges>();
    if (!data.active || !data.showOnMap) {
        await deleteAttachments(attachments);
        return;
    }
    await saveOrChangeAttachments(item, data, attachments, attachmentChanges);
    await updateAttachmentChanges(attachmentChanges);
};

/** Apply a batch of collected attachment changes in a single Owlbear Rodeo update. */
export const updateAttachmentChanges = async (changes: Map<string, ItemChanges>) => {
    if (changes.size === 0) {
        return;
    }
    await updateItems(
        (item) => changes.has(item.id),
        (items) => {
            items.forEach((item) => {
                const change = changes.get(item.id);
                if (!change) {
                    return;
                }
                if (change.width || change.width === 0) {
                    // @ts-ignore width exists on the shapes this extension attaches
                    item.width = change.width;
                }
                if (change.text !== undefined) {
                    // @ts-ignore text exists on the labels this extension attaches
                    item.text.plainText = change.text;
                }
                if (change.visible !== undefined) {
                    item.visible = change.visible;
                }
                if (change.position) {
                    item.position = change.position;
                }
            });
        },
    );
};
