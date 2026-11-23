import OBR from "@owlbear-rodeo/sdk";
import { changelogModal, helpModal, settingsModal, statblockModal } from "../../../helper/variables.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { SettingsSvg } from "../../svgs/SettingsSvg.tsx";
import { SheetSvg } from "../../svgs/SheetSvg.tsx";

type HelpButtonsProps = {
    ignoredChanges?: boolean;
    setIgnoredChange?: (ignoredChanges: boolean) => void;
};

export const Helpbuttons = (props: HelpButtonsProps) => {
    const playerContext = usePlayerContext();

    return (
        <div className={"help-buttons"}>
            {playerContext.role == "GM" ? (
                <Tippy content={"Open Settings"}>
                    <button
                        className={"settings-button top-button"}
                        onClick={async () => {
                            let width = 600;
                            let height = 900;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}
                            await OBR.modal.open({
                                ...settingsModal,
                                width: Math.min(500, width * 0.9),
                                height: Math.min(800, height * 0.9),
                            });
                        }}
                        title={"Settings"}
                    >
                        <SettingsSvg />
                    </button>
                </Tippy>
            ) : null}
            {playerContext.role == "GM" ? (
                <Tippy content={"Statblock library"}>
                    <button
                        className={"statblock-button top-button"}
                        onClick={async () => {
                            let width = 600;
                            let height = 900;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}
                            await OBR.modal.open({
                                ...statblockModal,
                                width: Math.min(500, width * 0.9),
                                height: Math.min(800, height * 0.9),
                            });
                        }}
                        title={"Statblocks"}
                    >
                        <SheetSvg />
                    </button>
                </Tippy>
            ) : null}
            <button
                className={`change-log-button top-button ${props.ignoredChanges ? "ignored" : ""}`}
                onClick={async () => {
                    if (props.setIgnoredChange !== undefined && props.ignoredChanges !== undefined) {
                        props.setIgnoredChange(!props.ignoredChanges);
                    }
                    let width = 700;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...changelogModal,
                        width: Math.min(600, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Changelog"}
            >
                i
            </button>
            <button
                className={"help-button top-button"}
                onClick={async () => {
                    let width = 800;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...helpModal,
                        width: Math.min(700, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Help"}
            >
                ?
            </button>
        </div>
    );
};
