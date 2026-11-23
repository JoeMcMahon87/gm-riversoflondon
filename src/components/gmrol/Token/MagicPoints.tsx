/**
 * A practitioner's magic points, and the warning that they have run out.
 *
 * The maximum is derived from POW and the mastered spell count on every render rather
 * than stored, so mastering a spell raises the ceiling without anything else having to
 * remember to update it.
 *
 * Only practitioners have a Magic skill, so the component renders nothing for everyone
 * else rather than showing an empty pool on every passer-by's sheet.
 */

import { Image } from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata } from "../../../helper/types.ts";
import { readNumericInput, restoreMagicPoints, setMagicPoints } from "../../../helper/tokenHelper.ts";
import { magicPointMax } from "../../../rules/characteristics.ts";
import { willDegradeOnCast } from "../../../rules/magic.ts";
import styles from "./resource.module.scss";

/** Whether this token is a practitioner, and so has magic points worth showing. */
export const isPractitioner = (data: RoLMetadata): boolean =>
    data.spells.length > 0 || data.skills.some((skill) => skill.label === "Magic");

export const MagicPoints = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const item = token?.item as Image | undefined;
    if (!data || !item || !isPractitioner(data)) {
        return null;
    }

    const max = magicPointMax(data.characteristics.POW, data.spells.filter((s) => s.mastered).length);
    const empty = willDegradeOnCast(data.magicPoints.current);

    return (
        <div className={`${styles.resource} ${empty ? styles.depleted : ""}`}>
            <span className={styles.label}>Magic</span>
            <input
                className={styles.value}
                disabled={!hasOwnership}
                value={data.magicPoints.current}
                onChange={(e) => setMagicPoints(readNumericInput(e.target.value, data.magicPoints.current), data, item)}
            />
            <Tippy content={`POW ${data.characteristics.POW} divided by 5, plus 1 per mastered spell`}>
                <span className={styles.max}>/ {max}</span>
            </Tippy>
            <Tippy content={"Magic points return to their maximum for the next scene"}>
                <button disabled={!hasOwnership} onClick={() => restoreMagicPoints(data, item)}>
                    Next scene
                </button>
            </Tippy>
            {empty ? (
                <Tippy content={"Casting from here forces a POW roll for Hyperthaumaturgical Degradation every time"}>
                    <span className={styles.warning}>empty</span>
                </Tippy>
            ) : null}
        </div>
    );
};
