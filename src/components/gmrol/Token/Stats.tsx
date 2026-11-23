/**
 * The five characteristics, each rollable and each editable in place.
 *
 * Characteristics are rolled against directly often enough in Rivers of London (a DEX
 * roll in a chase, a POW roll for Hyperthaumaturgical Degradation, a CON roll to keep
 * going) that they get the same roll control as skills rather than sitting on the sheet
 * as reference numbers.
 *
 * Adding a characteristic means adding it to ``CHARACTERISTICS``, never editing a loop
 * here.
 */

import { useEffect, useState } from "react";
import { Image } from "@owlbear-rodeo/sdk";
import { toNumber } from "lodash";
import Tippy from "@tippyjs/react";
import { RoLMetadata } from "../../../helper/types.ts";
import { getTokenName } from "../../../helper/helpers.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { CHARACTERISTICS, Characteristic } from "../../../rules/types.ts";
import { halfValue } from "../../../rules/characteristics.ts";
import { EditSvg } from "../../svgs/EditSvg.tsx";
import { RollButton } from "./RollButton.tsx";
import styles from "./stats.module.scss";

const Stat = ({
    name,
    value,
    character,
    edit,
    setValue,
    id,
}: {
    name: Characteristic;
    value: number;
    character: string;
    edit: boolean;
    setValue: (value: number) => void;
    id: string;
}) => {
    const [draft, setDraft] = useState<string>(value.toString());

    // Commit an in-progress edit when the sheet leaves edit mode, so a typed value is
    // not silently discarded by clicking the pencil again.
    useEffect(() => {
        if (!edit && draft !== value.toString()) {
            setValue(toNumber(draft));
        }
    }, [edit]);

    useEffect(() => {
        setDraft(value.toString());
    }, [value]);

    return (
        <div className={`button-wrapper ${styles.stat}`}>
            <span className={styles.name}>{name}</span>
            {edit ? (
                <input
                    className={styles.statInput}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={(e) => setValue(toNumber(e.target.value))}
                />
            ) : (
                <RollButton value={value} label={name} id={id} character={character} />
            )}
            <span className={styles.half}>{halfValue(value)}</span>
        </div>
    );
};

export const Stats = ({ data, item }: { data: RoLMetadata; item: Image }) => {
    const character = getTokenName(item);
    const [edit, setEdit] = useState<boolean>(false);

    return (
        <div className={styles.statsWrapper}>
            <div className={styles.stats}>
                {CHARACTERISTICS.map((name) => (
                    <Stat
                        key={name}
                        name={name}
                        value={data.characteristics[name]}
                        character={character}
                        edit={edit}
                        id={item.id}
                        setValue={async (value: number) => {
                            await updateTokenMetadata(
                                { ...data, characteristics: { ...data.characteristics, [name]: value } },
                                [item.id],
                            );
                        }}
                    />
                ))}
            </div>
            <Tippy content={"Edit characteristics"}>
                <button className={`${styles.edit} ${edit ? styles.active : ""}`} onClick={() => setEdit(!edit)}>
                    <EditSvg />
                </button>
            </Tippy>
        </div>
    );
};
