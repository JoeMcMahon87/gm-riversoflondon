/**
 * The Luck pool, with the two fixed-price spends the rules single out.
 *
 * Ordinary Luck spending is priced per roll and belongs with the roll it improves, so
 * it lives in the roll log rather than here. What this component carries is the pool
 * itself and the two spends with a flat cost: Trying Your Luck at 10, and surviving a
 * fatal blow at 30. Both are easy to forget and expensive to get wrong.
 */

import { Image } from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata } from "../../../helper/types.ts";
import { readNumericInput, setLuck, spendLuck, spendLuckOnFatalBlow } from "../../../helper/tokenHelper.ts";
import { currentCondition } from "../../../helper/attachmentHelpers.ts";
import { FATAL_BLOW_LUCK_COST, TRYING_YOUR_LUCK_COST } from "../../../rules/roll.ts";
import styles from "./resource.module.scss";

export const Luck = ({ id, hasOwnership }: { id: string; hasOwnership: boolean }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const item = token?.item as Image | undefined;
    if (!data || !item) {
        return null;
    }

    const facingFatalBlow = currentCondition(data) === "dead" && !data.damage.luckSpentOnFatalBlow;
    const canAffordSurvival = data.luck.current >= FATAL_BLOW_LUCK_COST;

    return (
        <div className={styles.resource}>
            <span className={styles.label}>Luck</span>
            <input
                className={styles.value}
                disabled={!hasOwnership}
                value={data.luck.current}
                onChange={(e) => setLuck(readNumericInput(e.target.value, data.luck.current), data, item)}
            />
            <Tippy content={`Trying Your Luck: spend ${TRYING_YOUR_LUCK_COST} to roll half a characteristic in place of an expert skill nobody has`}>
                <button
                    disabled={!hasOwnership || data.luck.current < TRYING_YOUR_LUCK_COST}
                    onClick={() => spendLuck(TRYING_YOUR_LUCK_COST, data, item)}
                >
                    Try Luck ({TRYING_YOUR_LUCK_COST})
                </button>
            </Tippy>
            {facingFatalBlow ? (
                <Tippy
                    content={
                        canAffordSurvival
                            ? `Spend ${FATAL_BLOW_LUCK_COST} Luck now to reduce the fatal blow to a mortal wound`
                            : `Not enough Luck to survive: ${FATAL_BLOW_LUCK_COST} needed`
                    }
                >
                    <button
                        className={styles.urgent}
                        disabled={!hasOwnership || !canAffordSurvival}
                        onClick={() => spendLuckOnFatalBlow(data, item, FATAL_BLOW_LUCK_COST)}
                    >
                        Survive ({FATAL_BLOW_LUCK_COST})
                    </button>
                </Tippy>
            ) : null}
        </div>
    );
};
