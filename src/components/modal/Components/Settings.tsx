import OBR from "@owlbear-rodeo/sdk";
import { useShallow } from "zustand/react/shallow";
import { modalId } from "../../../helper/variables.ts";
import { Groups } from "./Groups.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { isDicePlusAvailable } from "../../../helper/dicePlus.ts";
import { DiceRoller } from "../../../helper/types.ts";

/**
 * Room and scene settings.
 *
 * Room settings are shared by everyone at the table; scene settings affect only the
 * open scene, which is why the token groups live under the second heading.
 */
export const Settings = () => {
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));
    const dicePlusFound = isDicePlusAvailable();

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                <h2>Settings</h2>
                <div className={"settings-context vertical"}>
                    <h3>Room Settings</h3>
                    <span className={"small"}>(Shared across every scene in this room)</span>
                </div>
                <div className={"dice-roller setting"}>
                    Dice roller:
                    <select
                        value={room?.diceRoller ?? "local"}
                        onChange={(e) => updateRoomMetadata(room, { diceRoller: e.currentTarget.value as DiceRoller })}
                    >
                        <option value={"local"}>Built in (no dice shown)</option>
                        <option value={"dice-plus"} disabled={!dicePlusFound}>
                            Dice+ (3D dice){dicePlusFound ? "" : " \u2014 not detected"}
                        </option>
                    </select>
                </div>
                {!dicePlusFound ? (
                    <span className={"small"}>
                        Dice+ was not detected in this room. Add the Dice+ extension, then reload this one so it can
                        look again.
                    </span>
                ) : null}
                <div className={"reveal-success setting"}>
                    Show players the level of success, not just the number:
                    <input
                        type={"checkbox"}
                        checked={room?.revealSuccessLevel ?? true}
                        onChange={() => {
                            updateRoomMetadata(room, { revealSuccessLevel: !(room?.revealSuccessLevel ?? true) });
                        }}
                    />
                </div>
                <div className={"update-notification setting"}>
                    Don't show the changelog on updates:
                    <input
                        type={"checkbox"}
                        checked={room?.ignoreUpdateNotification || false}
                        onChange={() => {
                            updateRoomMetadata(room, { ignoreUpdateNotification: !room?.ignoreUpdateNotification });
                        }}
                    />
                </div>
                <div className={"settings-context vertical"}>
                    <h3>Scene Settings</h3>
                    <span className={"small"}>(Affects only the current scene)</span>
                </div>
                {scene ? (
                    <Groups />
                ) : (
                    <span className={"warning"}>Scene settings are available once a scene is open</span>
                )}
            </div>
        </>
    );
};
