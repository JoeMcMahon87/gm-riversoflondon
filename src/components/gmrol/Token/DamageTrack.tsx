/**
 * A character's damage condition, as a six-step track rather than a bar.
 *
 * The track shows the condition reached and the running total. The two worst steps are
 * reachable only by a single large blow, so they are shown as separate markers and can
 * be set directly: a GM resolving a four-damage spell needs to record a mortal wound,
 * not four taps on an increment button that would merely read as Down.
 *
 * Clearing the track is deliberately one button, because healing in Rivers of London is
 * resolved per fight rather than per point.
 */

import { Image } from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata } from "../../../helper/types.ts";
import { applyDamage, clearDamage, setConditionOverride, setDamageTotal } from "../../../helper/tokenHelper.ts";
import { currentCondition } from "../../../helper/attachmentHelpers.ts";
import { isImpaired, isIncapacitated } from "../../../rules/damage.ts";
import { DamageCondition } from "../../../rules/types.ts";
import styles from "./damage-track.module.scss";

/** How each condition reads on the track. */
const CONDITION_LABEL: Record<DamageCondition, string> = {
    healthy: "Unhurt",
    hurt: "Hurt",
    bloodied: "Bloodied",
    down: "Down",
    "mortally-wounded": "Mortal Wound",
    dead: "Dead",
};

/** What each condition does, shown on hover so the rule is at hand during a fight. */
const CONDITION_EFFECT: Record<DamageCondition, string> = {
    healthy: "No damage taken.",
    hurt: "In pain, but no mechanical effect.",
    bloodied: "Impaired: a roll of 90 or above now fumbles.",
    down: "Incapacitated and impaired: no further actions this fight.",
    "mortally-wounded": "Incapacitated. Needs medical attention within the hour, or two on a successful INT roll.",
    dead: "Killed outright by a fatal blow. 30 Luck, spent immediately, would have made this a mortal wound.",
};

/** The steps shown on the track, in order. Dead is reached, never clicked. */
const TRACK: readonly DamageCondition[] = ["hurt", "bloodied", "down", "mortally-wounded"] as const;

/** The damage total each clickable step corresponds to. */
const STEP_TOTAL: Record<string, number> = { hurt: 1, bloodied: 2, down: 3 };

export const DamageTrack = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const item = token?.item as Image | undefined;
    if (!data || !item) {
        return null;
    }

    const condition = currentCondition(data);

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.track} ${isIncapacitated(condition) ? styles.incapacitated : ""}`}>
                {TRACK.map((step) => {
                    const reached = CONDITION_LABEL[condition] !== undefined && stepReached(condition, step);
                    return (
                        <Tippy key={step} content={CONDITION_EFFECT[step]}>
                            <button
                                className={`${styles.step} ${styles[step.replace("-", "")]} ${
                                    reached ? styles.reached : ""
                                }`}
                                disabled={!hasOwnership}
                                onClick={async () => {
                                    if (step === "mortally-wounded") {
                                        // A mortal wound comes from a single four-point blow, so it
                                        // is set as one, not by raising the running total.
                                        await applyDamage(4 - data.damage.largestBlow, data, item);
                                        return;
                                    }
                                    await setDamageTotal(STEP_TOTAL[step], data, item);
                                }}
                            >
                                {CONDITION_LABEL[step]}
                            </button>
                        </Tippy>
                    );
                })}
            </div>
            <div className={styles.controls}>
                <Tippy content={"Damage taken so far this fight"}>
                    <span className={styles.total}>{data.damage.total}</span>
                </Tippy>
                <Tippy content={"Take one damage"}>
                    <button disabled={!hasOwnership} onClick={() => applyDamage(1, data, item)}>
                        +1
                    </button>
                </Tippy>
                <Tippy content={"Undo one damage"}>
                    <button
                        disabled={!hasOwnership || data.damage.total === 0}
                        onClick={() => setDamageTotal(data.damage.total - 1, data, item)}
                    >
                        -1
                    </button>
                </Tippy>
                <Tippy content={"The fight is over: clear all damage and any hand-set condition"}>
                    <button disabled={!hasOwnership} onClick={() => clearDamage(data, item)}>
                        Clear
                    </button>
                </Tippy>
                {data.conditionOverride ? (
                    <Tippy content={"This condition was set by hand. Click to go back to the one damage implies."}>
                        <button className={styles.override} onClick={() => setConditionOverride(null, data, item)}>
                            set by hand
                        </button>
                    </Tippy>
                ) : null}
            </div>
            <span className={`${styles.condition} ${isImpaired(condition) ? styles.impaired : ""}`}>
                {CONDITION_LABEL[condition]}
                {isImpaired(condition) ? " · impaired" : ""}
            </span>
        </div>
    );
};

/** Whether the track's step has been reached by the current condition. */
const stepReached = (condition: DamageCondition, step: DamageCondition): boolean => {
    const order: DamageCondition[] = ["healthy", "hurt", "bloodied", "down", "mortally-wounded", "dead"];
    return order.indexOf(condition) >= order.indexOf(step);
};
