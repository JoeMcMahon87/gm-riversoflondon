/**
 * The roll log, and the place Luck is spent.
 *
 * A roll's entry stays interactive while Luck could still change it, because the
 * decision to spend is made after seeing the number, and pricing it by hand ("I rolled
 * 34 against 30, so that's four") is exactly the arithmetic this extension should be
 * doing. Once Luck is spent the entry keeps both results: what the dice did and what it
 * was bought up to.
 *
 * Each entry shows the dice as well as the total, so a roll made with a bonus or
 * penalty die shows the tens die that was discarded.
 */

import { useShallow } from "zustand/react/shallow";
import Tippy from "@tippyjs/react";
import { RollLogEntryType, useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { applyLuckToRoll, SUCCESS_LABEL } from "../../../helper/rollHelper.ts";
import { luckOptions } from "../../../rules/roll.ts";
import { SuccessLevel } from "../../../rules/types.ts";
import styles from "./roll-log.module.scss";

/** The CSS modifier used to color each level of success. */
const LEVEL_CLASS: Record<SuccessLevel, string> = {
    critical: styles.critical,
    hard: styles.hard,
    regular: styles.regular,
    failure: styles.failure,
    fumble: styles.fumble,
};

/** Render the dice as rolled, marking the die a bonus or penalty discarded. */
const Dice = ({ tens, units, result }: { tens: number[]; units: number; result: number }) => {
    if (tens.length === 1) {
        return (
            <span className={styles.dice}>
                {tens[0] === 0 ? "00" : tens[0]} + {units}
            </span>
        );
    }
    return (
        <span className={styles.dice}>
            {tens.map((t, i) => {
                const combined = t === 0 && units === 0 ? 100 : t + units;
                return (
                    <span key={i} className={combined === result ? styles.kept : styles.discarded}>
                        {combined}
                    </span>
                );
            })}
        </span>
    );
};

/**
 * A single roll in the log.
 *
 * Exported because the floating roll-log popover renders entries without the list
 * chrome around them, and duplicating this markup is how the two views drift apart.
 */
export const RollLogEntry = ({ entry }: { entry: RollLogEntryType }) => {
    const playerContext = usePlayerContext();
    const level = entry.levelAfterLuck ?? entry.level;
    const options = entry.luckSpent === undefined ? luckOptions(entry.result, entry.target, entry.impaired) : [];
    const isOwnRoll = entry.owlbear_user_id === playerContext.id;

    return (
        <li className={`${styles.entry} ${LEVEL_CLASS[level]}`}>
            <div className={styles.line}>
                <span className={styles.who}>
                    {entry.tokenName ?? entry.username}
                    {entry.is_hidden ? <span className={styles.hidden}> (hidden)</span> : null}
                </span>
                <span className={styles.what}>{entry.label}</span>
                <Tippy content={`Target ${entry.target}`}>
                    <span className={styles.result}>{entry.result}</span>
                </Tippy>
            </div>
            <div className={styles.line}>
                <Dice tens={entry.tens} units={entry.units} result={entry.result} />
                <span className={styles.level}>
                    {SUCCESS_LABEL[level]}
                    {entry.luckSpent !== undefined ? (
                        <span className={styles.bought}> (bought with {entry.luckSpent} Luck)</span>
                    ) : null}
                </span>
                {entry.impaired ? (
                    <Tippy content={"Impaired: 90 and above fumbles"}>
                        <span className={styles.impaired}>impaired</span>
                    </Tippy>
                ) : null}
            </div>
            {options.length > 0 && isOwnRoll ? (
                <div className={styles.luck}>
                    <span>Spend Luck:</span>
                    {options.map((option) => (
                        <Tippy
                            key={option.level}
                            content={`Lower the result to ${entry.result - option.cost} for a ${SUCCESS_LABEL[
                                option.level
                            ].toLowerCase()}`}
                        >
                            <button onClick={() => applyLuckToRoll(entry.uuid, option.cost, option.level)}>
                                {option.cost} → {SUCCESS_LABEL[option.level]}
                            </button>
                        </Tippy>
                    ))}
                </div>
            ) : null}
            {entry.level === "fumble" && entry.luckSpent === undefined ? (
                <span className={styles.note}>Fumbles always apply and cannot be bought off.</span>
            ) : null}
        </li>
    );
};

export const RollLog = ({ classes }: { classes?: string }) => {
    const playerContext = usePlayerContext();
    const [log, clear] = useRollLogContext(useShallow((state) => [state.log, state.clear]));

    const visible = log.filter((entry) => !entry.is_hidden || playerContext.role === "GM");

    return (
        <div className={`${styles.rollLog} ${classes ?? ""}`}>
            <div className={styles.header}>
                <h3>Rolls</h3>
                <button onClick={() => clear()}>Clear</button>
            </div>
            <ul className={styles.entries}>
                {[...visible].reverse().map((entry) => (
                    <RollLogEntry key={entry.uuid} entry={entry} />
                ))}
            </ul>
            {visible.length === 0 ? <span className={styles.empty}>No rolls yet.</span> : null}
        </div>
    );
};
