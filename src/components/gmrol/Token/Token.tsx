/**
 * One token's sheet, as it appears in the list and in the map popover.
 *
 * The sheet is laid out by what a GM reaches for during a scene rather than by the
 * printed character sheet's order: condition first, because it gates everything else
 * through impairment, then the pools that get spent, then the things that get rolled.
 *
 * The popover is deliberately shorter than the list entry. It opens over the map with a
 * fixed height, so skills and spells are left to the full sheet.
 */

import React, { useRef } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import _ from "lodash";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { RoLMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { currentCondition } from "../../../helper/attachmentHelpers.ts";
import { isIncapacitated } from "../../../rules/damage.ts";
import { TokenIcon } from "./TokenIcon.tsx";
import { Stats } from "./Stats.tsx";
import { DamageTrack } from "./DamageTrack.tsx";
import { Luck } from "./Luck.tsx";
import { MagicPoints } from "./MagicPoints.tsx";
import { Skills } from "./Skills.tsx";
import { Spells } from "./Spells.tsx";
import { Owner } from "./Owner.tsx";
import { MapSvg } from "../../svgs/MapSvg.tsx";

/** A double tap within this many milliseconds counts as a double click on touch devices. */
const DOUBLE_TAP_MS = 300;

type TokenProps = {
    id: string;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
    isDragging?: boolean;
};

export const Token = (props: TokenProps) => {
    const component = useComponentContext(useShallow((state) => state.component));
    const playerContext = usePlayerContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as RoLMetadata;
    const item = token?.item as Image;
    const start = useRef<number>(0);

    if (!data || !item) {
        return <></>;
    }

    const hasOwnership = playerContext.role === "GM" || item.createdUserId === playerContext.id;
    const condition = currentCondition(data);

    const getGroupSelectRange = (currentSelection: Array<string>): Array<string> | null => {
        const currentGroup = data.group;

        if (currentGroup || currentGroup === undefined) {
            const groupItems = props.tokenLists?.get(currentGroup || "Default");
            if (groupItems) {
                const index = data.index || groupItems.indexOf(item);
                const selectedGroupItems = groupItems.filter((item) => currentSelection.includes(item.id));

                const sortedByDistance = selectedGroupItems.sort((a, b) => {
                    const aData = a.metadata[itemMetadataKey] as RoLMetadata;
                    const bData = b.metadata[itemMetadataKey] as RoLMetadata;
                    const aDelta = Math.abs(index - aData.index!);
                    const bDelta = Math.abs(index - bData.index!);
                    if (aDelta < bDelta) {
                        return -1;
                    } else if (bDelta < aDelta) {
                        return 1;
                    }
                    return 0;
                });

                if (sortedByDistance.length > 0) {
                    const closestDistance = sortedByDistance[0];
                    const cdData = closestDistance.metadata[itemMetadataKey] as RoLMetadata;
                    const cdIndex = cdData.index || groupItems.indexOf(closestDistance);
                    const indices = cdIndex < index ? _.range(cdIndex, index) : _.range(index, cdIndex);

                    const toSelect = groupItems.map((item) => {
                        const itemData = item.metadata[itemMetadataKey] as RoLMetadata;
                        if (itemData.index) {
                            if (indices.includes(itemData.index)) {
                                return item.id;
                            }
                        } else if (indices.includes(groupItems.indexOf(item))) {
                            return item.id;
                        }
                    });

                    return toSelect.filter((item): item is string => !!item);
                }
            }
        }

        return null;
    };

    const handleOnPlayerClick = async (e: React.MouseEvent<HTMLDivElement>, force?: boolean) => {
        if (!force && (e.target as HTMLElement).tagName !== "DIV") {
            // Stop a click on a child control from also changing the map selection.
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const currentSelection = (await OBR.player.getSelection()) || [];
        if (currentSelection.length === 0) {
            await OBR.player.select([props.id]);
            return;
        }
        if (currentSelection.includes(props.id)) {
            currentSelection.splice(currentSelection.indexOf(props.id), 1);
            await OBR.player.select(currentSelection);
            return;
        }
        if (e.shiftKey) {
            const toSelect = getGroupSelectRange(currentSelection);
            if (toSelect) {
                await OBR.player.select([...currentSelection, ...toSelect, props.id]);
            }
        } else if (e.metaKey || e.ctrlKey) {
            await OBR.player.select([...currentSelection, props.id]);
        } else {
            await OBR.player.select([props.id]);
        }
    };

    const handleOnPlayerDoubleClick = async (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
        if ((e.target as HTMLElement).tagName !== "DIV") {
            return;
        }
        const bounds = await OBR.scene.items.getItemBounds([props.id]);
        await OBR.player.select([props.id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    const display = (): boolean =>
        data.active && (playerContext.role === "GM" || item.createdUserId === playerContext.id || data.isPlayer);

    if (!display()) {
        return data.showOnMap && item.visible ? (
            <div ref={containerRef} className={"token"}>
                <TokenIcon id={props.id} hideName={true} />
            </div>
        ) : (
            <></>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`token ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            } ${component} ${isIncapacitated(condition) ? "incapacitated" : ""}`}
            onClick={(e) => handleOnPlayerClick(e)}
            onDoubleClick={(e) => handleOnPlayerDoubleClick(e)}
            onTouchStart={(e) => {
                const now = Date.now();
                if (now - start.current < DOUBLE_TAP_MS) {
                    handleOnPlayerDoubleClick(e);
                } else {
                    start.current = now;
                }
            }}
        >
            <TokenIcon
                id={props.id}
                onClick={async (e) => handleOnPlayerClick(e, true)}
                hideName={!display()}
                isDragging={props.isDragging}
            />
            <div className={"section"}>
                <DamageTrack id={props.id} hasOwnership={hasOwnership} />
            </div>
            {hasOwnership ? (
                <div className={"section"}>
                    <Luck id={props.id} hasOwnership={hasOwnership} />
                    <MagicPoints id={props.id} hasOwnership={hasOwnership} />
                </div>
            ) : null}
            {hasOwnership ? (
                <div className={"section"}>
                    <Stats data={data} item={item} />
                </div>
            ) : null}
            {component !== "popover" && hasOwnership ? (
                <>
                    <Skills id={props.id} hasOwnership={hasOwnership} />
                    <Spells id={props.id} hasOwnership={hasOwnership} />
                </>
            ) : null}
            {playerContext.role === "GM" ? (
                <div className={"section"}>
                    <Owner id={props.id} />
                    <Tippy content={"Show this token's condition on the map"}>
                        <button
                            className={`map ${data.showOnMap ? "active" : ""}`}
                            onClick={async () => {
                                await updateTokenMetadata({ ...data, showOnMap: !data.showOnMap }, [props.id]);
                            }}
                        >
                            <MapSvg />
                        </button>
                    </Tippy>
                </div>
            ) : null}
        </div>
    );
};
