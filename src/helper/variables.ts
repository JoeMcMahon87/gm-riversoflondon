/**
 * Extension-wide identifiers, window definitions and the default token record.
 *
 * The metadata keys are namespaced by ``ID`` because Owlbear Rodeo shares one metadata
 * bag per item across every installed extension; a bare key such as "data" would
 * collide with the next extension that thought of it.
 */

import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";
import { RoLMetadata } from "./types.ts";
import { DEFAULT_MOV, AVERAGE_CHARACTERISTIC } from "../rules/characteristics.ts";
import { startingSkills } from "../rules/skills.ts";

/** Reverse-domain identifier namespacing every metadata key and window id. */
export const ID = "com.joemcmahon.gm-riversoflondon";

export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const rollLogPopoverId = `${ID}/roll-log`;
export const rollMessageChannel = `${ID}.roll-event`;

export const version = "0.1.0";

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
};

export const rollLogPopover: Popover = {
    id: rollLogPopoverId,
    url: "/rolllog.html",
    width: 350,
    height: 200,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { vertical: "BOTTOM", horizontal: "RIGHT" },
    marginThreshold: 10,
    disableClickAway: true,
    hidePaper: true,
};

/**
 * The record a token gets when it is first added to the tracker.
 *
 * Characteristics start at the book's "average human" 50 rather than at zero, so a GM
 * who adds a passer-by and rolls immediately gets a plausible result instead of an
 * automatic failure.
 */
export const defaultMetadata: RoLMetadata = {
    active: true,
    isPlayer: false,
    showOnMap: false,
    characteristics: {
        STR: AVERAGE_CHARACTERISTIC,
        CON: AVERAGE_CHARACTERISTIC,
        DEX: AVERAGE_CHARACTERISTIC,
        INT: AVERAGE_CHARACTERISTIC,
        POW: AVERAGE_CHARACTERISTIC,
    },
    skills: startingSkills(),
    spells: [],
    weapons: [],
    damage: { total: 0, largestBlow: 0, luckSpentOnFatalBlow: false },
    luck: { current: 0, starting: 0 },
    magicPoints: { current: 0 },
    mov: DEFAULT_MOV,
    conditionOverride: null,
    notes: "",
    group: "Default",
};

/**
 * Fill in any field a stored record is missing.
 *
 * Records written by an older version of the extension are read, not migrated: a new
 * field defaults here and is written back the next time the token changes. That keeps
 * an upgrade from having to walk every scene the user has ever made, at the cost of
 * this function having to stay exhaustive.
 *
 * Args:
 *     stored: Whatever was found under ``itemMetadataKey``, which may predate any
 *         given field.
 *
 * Returns:
 *     A complete record, safe to read every field from.
 */
export const normalizeToken = (stored: Partial<RoLMetadata> | undefined): RoLMetadata => ({
    ...defaultMetadata,
    ...stored,
    characteristics: { ...defaultMetadata.characteristics, ...stored?.characteristics },
    damage: { ...defaultMetadata.damage, ...stored?.damage },
    luck: { ...defaultMetadata.luck, ...stored?.luck },
    magicPoints: { ...defaultMetadata.magicPoints, ...stored?.magicPoints },
    skills: stored?.skills ?? defaultMetadata.skills,
    spells: stored?.spells ?? defaultMetadata.spells,
    weapons: stored?.weapons ?? defaultMetadata.weapons,
});
