/**
 * A practitioner's spells, and casting them.
 *
 * Casting is one button because the sequence is fixed and tedious: check whether the
 * caster is already empty, spend the order's worth of magic points, then roll Magic.
 * Doing it by hand is how a table ends up with a practitioner who has been casting on
 * an empty pool for three scenes without a single Hyperthaumaturgical Degradation roll.
 *
 * The spell *names* are whatever the practitioner's player wrote down. No spell list
 * ships with this extension.
 */

import { useState } from "react";
import { Image } from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata, Spell } from "../../../helper/types.ts";
import { getTokenName } from "../../../helper/helpers.ts";
import { spendMagicPoints, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { makeRoll } from "../../../helper/rollHelper.ts";
import { currentCondition } from "../../../helper/attachmentHelpers.ts";
import { isImpaired } from "../../../rules/damage.ts";
import { spellCost, willDegradeOnCast } from "../../../rules/magic.ts";
import { CHOSEN_COMMON_SKILL_VALUE } from "../../../rules/skills.ts";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import styles from "./skills.module.scss";

/** An unmastered spell is cast with a penalty die (core book p. 174, Table 11). */
const UNMASTERED_MODIFIER = "penalty" as const;

export const Spells = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const item = token?.item as Image | undefined;
    const [adding, setAdding] = useState("");

    if (!data || !item) {
        return null;
    }

    const character = getTokenName(item);
    const magicSkill = data.skills.find((s) => s.label === "Magic");

    const write = async (spells: Spell[]) => {
        await updateTokenMetadata({ ...data, spells }, [item.id]);
    };

    /**
     * Give this token the Magic skill.
     *
     * Casting rolls against Magic, and Magic is an expert skill, so a token built from
     * the defaults does not have it and cannot cast. Offering to add it here is the
     * difference between a dead button and a one-click fix.
     */
    const addMagicSkill = async () => {
        await updateTokenMetadata(
            { ...data, skills: [...data.skills, { label: "Magic", value: CHOSEN_COMMON_SKILL_VALUE, expert: true }] },
            [item.id],
        );
    };

    /**
     * Spend the magic points and roll Magic.
     *
     * The degradation roll itself is not made here: the trigger is announced in the log
     * so the GM can decide whether the caster is pushing, which changes whether the POW
     * roll takes a penalty die.
     */
    const cast = async (spell: Spell) => {
        if (!magicSkill) {
            return;
        }
        const emptyBefore = willDegradeOnCast(data.magicPoints.current);
        const cost = spellCost(spell.order);
        await spendMagicPoints(cost, data, item);
        await makeRoll({
            label: emptyBefore ? `${spell.label} (casting on empty)` : spell.label,
            target: magicSkill.value,
            modifier: spell.mastered ? "none" : UNMASTERED_MODIFIER,
            impaired: isImpaired(currentCondition(data)),
            tokenName: character,
            username: playerContext.name ?? "Unknown",
            playerId: playerContext.id ?? undefined,
        });
    };

    return (
        <div className={styles.skills}>
            <div className={styles.header}>
                <h4>Spells</h4>
            </div>
            {!magicSkill ? (
                <div className={styles.missingSkill}>
                    <span>Casting rolls against the Magic skill, which this token does not have.</span>
                    {hasOwnership ? <button onClick={addMagicSkill}>Add Magic skill</button> : null}
                </div>
            ) : null}
            <ul className={styles.list}>
                {data.spells.map((spell, index) => (
                    <li key={`${spell.label}-${index}`} className={styles.skill}>
                        <span className={styles.name}>{spell.label}</span>
                        <Tippy content={"The spell's order, which is its cost in magic points"}>
                            <input
                                className={styles.order}
                                value={spell.order}
                                disabled={!hasOwnership}
                                onChange={(e) => {
                                    const order = Math.max(Number(e.target.value.replace(/[^0-9]/g, "")) || 0, 0);
                                    write(data.spells.map((s, i) => (i === index ? { ...s, order } : s)));
                                }}
                            />
                        </Tippy>
                        <Tippy content={"Mastered: cast without a penalty die, and +1 to the magic point ceiling"}>
                            <button
                                className={`${styles.mastered} ${spell.mastered ? styles.active : ""}`}
                                disabled={!hasOwnership}
                                onClick={() =>
                                    write(
                                        data.spells.map((s, i) => (i === index ? { ...s, mastered: !s.mastered } : s)),
                                    )
                                }
                            >
                                M
                            </button>
                        </Tippy>
                        <Tippy
                            content={
                                magicSkill
                                    ? `Spend ${spellCost(spell.order)} magic points and roll Magic ${magicSkill.value}${
                                          spell.mastered ? "" : " with a penalty die"
                                      }`
                                    : "This token has no Magic skill to roll against"
                            }
                        >
                            {/* The span is load-bearing: a disabled button emits no mouse
                                events, so a Tippy placed directly on one never shows and
                                the button looks simply broken. */}
                            <span className={styles.castWrapper}>
                                <button
                                    className={styles.cast}
                                    disabled={!hasOwnership || !magicSkill}
                                    onClick={() => cast(spell)}
                                >
                                    Cast
                                </button>
                            </span>
                        </Tippy>
                        {hasOwnership ? (
                            <button
                                className={styles.remove}
                                onClick={() => write(data.spells.filter((_, i) => i !== index))}
                            >
                                <DeleteSvg />
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
            {hasOwnership ? (
                <div className={styles.add}>
                    <input
                        placeholder={"Add a spell"}
                        value={adding}
                        onChange={(e) => setAdding(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && adding.trim()) {
                                write([...data.spells, { label: adding.trim(), order: 1, mastered: false }]);
                                setAdding("");
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            if (adding.trim()) {
                                write([...data.spells, { label: adding.trim(), order: 1, mastered: false }]);
                                setAdding("");
                            }
                        }}
                    >
                        <AddSvg />
                    </button>
                </div>
            ) : null}
        </div>
    );
};
