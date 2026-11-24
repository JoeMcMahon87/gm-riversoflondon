/**
 * Roll the dice through the Dice+ extension instead of locally.
 *
 * Dice+ is a separate Owlbear Rodeo extension that renders 3D physics dice everyone at
 * the table can see. Extensions cannot call each other, so the whole exchange is
 * broadcast messages: a readiness handshake at startup, then one request per roll whose
 * result arrives asynchronously on a channel namespaced by this extension's own ID.
 *
 * This module only obtains dice faces. It does not resolve anything: the faces are fed
 * to ``rollPercentile`` so that a Dice+ roll and a local roll go through exactly the
 * same tested resolution, rather than growing a second implementation that drifts.
 */

import OBR from "@owlbear-rodeo/sdk";
import { dicePlusAvailableKey, ID } from "./variables.ts";
import { normalizeD10 } from "../rules/roll.ts";

/** Dice+ listens for roll requests here. */
const REQUEST_CHANNEL = "dice-plus/roll-request";

/** Dice+ answers readiness checks on this channel, request and response both. */
const READY_CHANNEL = "dice-plus/isReady";

/** Dice+ sends results back namespaced by the requesting extension's ID. */
const RESPONSE_CHANNEL = `${ID}/roll-result`;

/** Dice+ reports notation errors here. */
const ERROR_CHANNEL = `${ID}/roll-error`;

/** How long to wait for a readiness answer before deciding Dice+ is absent. */
const READY_TIMEOUT_MS = 1000;

/**
 * How long to wait for a roll result before falling back to a local roll.
 *
 * Generous, because the dice are physically simulated and a slow machine takes a
 * moment. Falling back is still better than a button that never resolves: the table is
 * mid-scene and needs a number.
 */
const ROLL_TIMEOUT_MS = 15000;

/** A single die as Dice+ reports it. */
interface DicePlusDie {
    diceId: string;
    rollId: string;
    diceType: string;
    value: number;
    kept: boolean;
}

interface DicePlusGroup {
    description: string;
    diceModel: string;
    diceType: string;
    dice: Array<DicePlusDie>;
    total: number;
    isNegative: boolean;
}

interface DicePlusResult {
    rollId: string;
    playerId: string;
    playerName: string;
    rollTarget: "everyone" | "self" | "dm";
    timestamp: number;
    result: {
        rollId: string;
        diceNotation: string;
        totalValue: number;
        rollSummary: string;
        groups: Array<DicePlusGroup>;
    };
}

interface DicePlusError {
    rollId: string;
    notation: string;
    error: string;
}

/**
 * Pull the individual d10 faces out of a Dice+ result, in rolled order.
 *
 * The faces are taken across every group because a request for `3d10` may be reported
 * as one group or several depending on how Dice+ chooses to present it.
 */
export const facesFromResult = (data: DicePlusResult): number[] =>
    data.result.groups.flatMap((group) => group.dice.map((die) => normalizeD10(die.value)));

/** Whether Dice+ answered a readiness check during this session. */
export const isDicePlusAvailable = (): boolean => {
    try {
        return window.localStorage.getItem(dicePlusAvailableKey) === "true";
    } catch {
        return false;
    }
};

/** Record whether Dice+ answered, for the settings UI and the roll path to read. */
const setDicePlusAvailable = (available: boolean) => {
    try {
        window.localStorage.setItem(dicePlusAvailableKey, available ? "true" : "false");
    } catch {
        // A browser refusing localStorage only costs the cached answer; the roll path
        // falls back on its own.
    }
};

/**
 * Ask whether Dice+ is installed and listening.
 *
 * Resolves false rather than rejecting on timeout: "no answer" is the normal result
 * when the extension is simply not installed, not an error worth surfacing.
 */
export const checkDicePlusReady = async (): Promise<boolean> => {
    const requestId = crypto.randomUUID();

    return new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (available: boolean) => {
            if (settled) {
                return;
            }
            settled = true;
            unsubscribe();
            window.clearTimeout(timer);
            setDicePlusAvailable(available);
            resolve(available);
        };

        const unsubscribe = OBR.broadcast.onMessage(READY_CHANNEL, (event) => {
            const data = event.data as { requestId?: string; ready?: boolean };
            // The channel carries this extension's own outgoing request too, so only a
            // message that both answers and matches counts.
            if (data?.ready === true && data.requestId === requestId) {
                finish(true);
            }
        });

        const timer = window.setTimeout(() => finish(false), READY_TIMEOUT_MS);

        OBR.broadcast
            .sendMessage(READY_CHANNEL, { requestId, timestamp: Date.now() }, { destination: "ALL" })
            .catch(() => finish(false));
    });
};

/**
 * Ask Dice+ to roll a number of d10s and return their faces.
 *
 * Args:
 *     count: How many d10s to roll. A percentile roll needs two (one tens, one units)
 *         and a roll carrying a bonus or penalty die needs three.
 *     label: The name shown on the Dice+ roll, so the table can see what is being
 *         rolled for.
 *     hidden: A hidden roll is shown to the roller alone.
 *
 * Returns:
 *     The faces as 0-9 values in rolled order, or null if Dice+ failed to answer, erred,
 *     or returned fewer dice than asked for. A null means the caller should roll
 *     locally instead.
 */
export const requestDicePlusRoll = async (
    count: number,
    label: string,
    hidden: boolean,
): Promise<number[] | null> => {
    const rollId = crypto.randomUUID();

    return new Promise<number[] | null>((resolve) => {
        let settled = false;
        const finish = (faces: number[] | null) => {
            if (settled) {
                return;
            }
            settled = true;
            unsubscribeResult();
            unsubscribeError();
            window.clearTimeout(timer);
            resolve(faces);
        };

        const unsubscribeResult = OBR.broadcast.onMessage(RESPONSE_CHANNEL, (event) => {
            const data = event.data as DicePlusResult;
            if (data?.rollId !== rollId) {
                return;
            }
            const faces = facesFromResult(data);
            // Fewer dice than asked for cannot be resolved, so it is treated as a
            // failure and falls back rather than silently rolling a different roll.
            finish(faces.length >= count ? faces.slice(0, count) : null);
        });

        const unsubscribeError = OBR.broadcast.onMessage(ERROR_CHANNEL, (event) => {
            const data = event.data as DicePlusError;
            if (data?.rollId === rollId) {
                console.warn(`GM's Rivers of London: Dice+ rejected "${data.notation}": ${data.error}`);
                finish(null);
            }
        });

        const timer = window.setTimeout(() => {
            console.warn("GM's Rivers of London: Dice+ did not answer in time, rolling locally");
            finish(null);
        }, ROLL_TIMEOUT_MS);

        OBR.broadcast
            .sendMessage(
                REQUEST_CHANNEL,
                {
                    source: ID,
                    rollId,
                    playerId: OBR.player.id,
                    playerName: label,
                    rollTarget: hidden ? "self" : "everyone",
                    diceNotation: `${count}d10`,
                    // Dice+ totals its own dice, and a sum of d10s means nothing in a
                    // percentile system. The result is shown in this extension's log.
                    showResults: false,
                    timestamp: Date.now(),
                },
                { destination: "ALL" },
            )
            .catch(() => finish(null));
    });
};
