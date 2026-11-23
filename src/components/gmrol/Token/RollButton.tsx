/**
 * The control behind every rollable number on a sheet.
 *
 * A click rolls straight; hovering reveals the bonus die, penalty die and hidden-roll
 * variants, so the common case stays one click and the modifiers never need a separate
 * dialog. Impairment is read from the token rather than asked for, because a GM who has
 * to remember to tick "impaired" will forget, and the widened fumble range is precisely
 * the rule this extension exists to apply.
 *
 * Kept free of rules arithmetic: it collects intent and hands it to ``makeRoll``.
 */

import { useState } from "react";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata } from "../../../helper/types.ts";
import { makeRoll, SUCCESS_LABEL } from "../../../helper/rollHelper.ts";
import { currentCondition } from "../../../helper/attachmentHelpers.ts";
import { isImpaired } from "../../../rules/damage.ts";
import { hardThreshold } from "../../../rules/roll.ts";
import { DiceModifier } from "../../../rules/types.ts";
import styles from "./stats.module.scss";

interface RollButtonProps {
    /** The value the roll must come in at or under. */
    value: number;
    /** What is being rolled, shown in the log. */
    label: string;
    /** The token the roll belongs to. */
    id: string;
    /** The token's display name, shown in the log. */
    character: string;
    /** Rendered inside the button; defaults to the value itself. */
    children?: React.ReactNode;
    className?: string;
}

export const RollButton = ({ value, label, id, character, children, className }: RollButtonProps) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as RoLMetadata | undefined;
    const [rolling, setRolling] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const impaired = data ? isImpaired(currentCondition(data)) : false;

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [autoPlacement({ autoAlignment: true, crossAxis: true, allowedPlacements: ["left", "right"] })],
    });
    const hover = useHover(context, { handleClose: safePolygon() });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const roll = async (modifier: DiceModifier, hidden: boolean = false) => {
        setRolling(true);
        try {
            await makeRoll({
                label,
                target: value,
                modifier,
                impaired,
                tokenName: character,
                hidden,
                username: playerContext.name ?? "Unknown",
                playerId: playerContext.id ?? undefined,
            });
        } finally {
            setRolling(false);
        }
    };

    const tooltip = [
        `Regular ${value} / Hard ${hardThreshold(value)}`,
        impaired ? "impaired: 90+ fumbles" : null,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className={`button-wrapper ${styles.stat} ${className ?? ""}`}>
            <Tippy content={tooltip}>
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    className={`dice-button button ${rolling ? "rolling" : ""} ${impaired ? styles.impaired : ""} ${
                        styles.statValue
                    }`}
                    onClick={() => roll("none")}
                >
                    {children ?? value}
                </button>
            </Tippy>
            {isOpen ? (
                <span
                    ref={refs.setFloating}
                    {...getFloatingProps()}
                    style={floatingStyles}
                    className={"dice-context-button visible full"}
                >
                    <Tippy content={"Roll an extra tens die and keep the better result"}>
                        <button className={"advantage"} onClick={() => roll("bonus")}>
                            BONUS
                        </button>
                    </Tippy>
                    <Tippy content={"Roll an extra tens die and keep the worse result"}>
                        <button className={"disadvantage"} onClick={() => roll("penalty")}>
                            PENALTY
                        </button>
                    </Tippy>
                    {playerContext.role === "GM" ? (
                        <Tippy content={"Roll without telling the table"}>
                            <button className={"self"} onClick={() => roll("none", true)}>
                                HIDE
                            </button>
                        </Tippy>
                    ) : null}
                </span>
            ) : null}
        </div>
    );
};

/** Describe a level of success in words, for anywhere a result is shown. */
export const successLabel = (level: keyof typeof SUCCESS_LABEL) => SUCCESS_LABEL[level];
