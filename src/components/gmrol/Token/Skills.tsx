/**
 * A character's skills, each one a roll waiting to be made.
 *
 * Skills are stored per token rather than assumed, because an NPC's sheet is usually
 * three skills long and padding it with the full list would bury them. The picker adds
 * from the rules' list; anything not on it can be typed, since the rules themselves
 * invite new skills.
 */

import { useState } from "react";
import { Image } from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata, Skill } from "../../../helper/types.ts";
import { getTokenName } from "../../../helper/helpers.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { ALL_SKILLS, BASE_COMMON_SKILL_VALUE, skillBand } from "../../../rules/skills.ts";
import { halfValue } from "../../../rules/characteristics.ts";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import { EditSvg } from "../../svgs/EditSvg.tsx";
import { RollButton } from "./RollButton.tsx";
import styles from "./skills.module.scss";

export const Skills = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const item = token?.item as Image | undefined;
    const [edit, setEdit] = useState(false);
    const [adding, setAdding] = useState("");

    if (!data || !item) {
        return null;
    }

    const character = getTokenName(item);

    const write = async (skills: Skill[]) => {
        await updateTokenMetadata({ ...data, skills }, [item.id]);
    };

    const addSkill = async (label: string) => {
        const trimmed = label.trim();
        if (!trimmed || data.skills.some((s) => s.label.toLowerCase() === trimmed.toLowerCase())) {
            return;
        }
        const definition = ALL_SKILLS.find((s) => s.label === trimmed);
        await write([
            ...data.skills,
            { label: trimmed, value: BASE_COMMON_SKILL_VALUE, expert: definition?.category === "expert" },
        ]);
        setAdding("");
    };

    const unused = ALL_SKILLS.filter((s) => !data.skills.some((existing) => existing.label === s.label));

    return (
        <div className={styles.skills}>
            <div className={styles.header}>
                <h4>Skills</h4>
                <Tippy content={"Edit skill values"}>
                    <button className={edit ? styles.active : ""} onClick={() => setEdit(!edit)}>
                        <EditSvg />
                    </button>
                </Tippy>
            </div>
            <ul className={styles.list}>
                {data.skills.map((skill, index) => (
                    <li key={`${skill.label}-${index}`} className={styles.skill}>
                        <Tippy content={`${skillBand(skill.value)} · Hard ${halfValue(skill.value)}`}>
                            <span className={`${styles.name} ${skill.expert ? styles.expert : ""}`}>
                                {skill.label}
                            </span>
                        </Tippy>
                        {edit ? (
                            <>
                                <input
                                    className={styles.input}
                                    value={skill.value}
                                    disabled={!hasOwnership}
                                    onChange={(e) => {
                                        const value = Math.max(Number(e.target.value.replace(/[^0-9]/g, "")) || 0, 0);
                                        write(data.skills.map((s, i) => (i === index ? { ...s, value } : s)));
                                    }}
                                />
                                <Tippy content={"Remove this skill"}>
                                    <button
                                        className={styles.remove}
                                        disabled={!hasOwnership}
                                        onClick={() => write(data.skills.filter((_, i) => i !== index))}
                                    >
                                        <DeleteSvg />
                                    </button>
                                </Tippy>
                            </>
                        ) : (
                            <RollButton
                                value={skill.value}
                                label={skill.label}
                                id={id}
                                character={character}
                                className={styles.roll}
                            />
                        )}
                    </li>
                ))}
            </ul>
            {edit && hasOwnership ? (
                <div className={styles.add}>
                    <input
                        list={`${id}-skill-options`}
                        placeholder={"Add a skill"}
                        value={adding}
                        onChange={(e) => setAdding(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                addSkill(adding);
                            }
                        }}
                    />
                    <datalist id={`${id}-skill-options`}>
                        {unused.map((s) => (
                            <option key={s.label} value={s.label} />
                        ))}
                    </datalist>
                    <button onClick={() => addSkill(adding)}>
                        <AddSvg />
                    </button>
                </div>
            ) : null}
        </div>
    );
};
