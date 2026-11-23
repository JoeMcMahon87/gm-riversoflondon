/**
 * The statblock library: save a token's sheet, apply it to others, export and import.
 *
 * Applying to the current selection rather than to a chosen token is what makes this
 * useful mid-session: four identical Little Crocodiles get their statistics in one
 * click, each keeping whatever damage it has already taken.
 *
 * Export and import are plain JSON, so a library can be moved between browsers or kept
 * in a scenario folder alongside the rest of your prep. No statblock data ships with
 * this extension.
 */

import { useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { modalId, itemMetadataKey } from "../../../helper/variables.ts";
import {
    applyStatblock,
    Statblock,
    statblockFromToken,
    useStatblockContext,
} from "../../../context/StatblockContext.tsx";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { RoLMetadata } from "../../../helper/types.ts";
import { updateItems } from "../../../helper/obrHelper.ts";
import { getTokenName } from "../../../helper/helpers.ts";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import { CopySvg } from "../../svgs/CopySvg.tsx";

export const Statblocks = () => {
    const [statblocks, save, remove] = useStatblockContext(
        useShallow((state) => [state.statblocks, state.save, state.remove]),
    );
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const [selection, setSelection] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    // The selection is read on demand rather than subscribed to: this modal is opened
    // deliberately, and a selection that shifts underneath it would be more surprising
    // than one that needs a refresh.
    const refreshSelection = async () => setSelection((await OBR.player.getSelection()) ?? []);

    const selectedTokens = selection
        .map((id) => tokens?.get(id))
        .filter((t): t is NonNullable<typeof t> => t !== undefined);

    const saveSelected = () => {
        const source = selectedTokens[0];
        if (!source) {
            setMessage("Select a token on the map first, then refresh the selection.");
            return;
        }
        const label = name.trim() || getTokenName(source.item);
        if (!label) {
            setMessage("Give the statblock a name.");
            return;
        }
        save(statblockFromToken(label, source.data as RoLMetadata));
        setName("");
        setMessage(`Saved "${label}".`);
    };

    const applyToSelection = async (statblock: Statblock) => {
        if (selection.length === 0) {
            setMessage("Select the tokens to apply this to, then refresh the selection.");
            return;
        }
        await updateItems(selection, (items) => {
            items.forEach((item) => {
                const data = item.metadata[itemMetadataKey] as RoLMetadata | undefined;
                if (data) {
                    item.metadata[itemMetadataKey] = applyStatblock(statblock, data);
                }
            });
        });
        setMessage(`Applied "${statblock.name}" to ${selection.length} token(s).`);
    };

    const exportLibrary = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(statblocks, null, 2));
            setMessage("Library copied to the clipboard as JSON.");
        } catch {
            setMessage("Could not reach the clipboard. Check the browser's permissions.");
        }
    };

    const importLibrary = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                throw new Error("not a list");
            }
            parsed.forEach((entry: Statblock) => {
                if (entry && typeof entry.name === "string") {
                    save(entry);
                }
            });
            setMessage(`Imported ${parsed.length} statblock(s).`);
        } catch {
            setMessage("That is not a statblock library. Paste the JSON that Export produced.");
        }
    };

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                <h2>Statblocks</h2>
                <p className={"small"}>
                    Saved in this browser, not in the scene, so the library follows you between rooms. Nothing is
                    shared with players.
                </p>

                <div className={"settings-context vertical"}>
                    <h3>Selection</h3>
                    <span className={"small"}>
                        {selection.length === 0
                            ? "No tokens selected."
                            : `${selection.length} token(s) selected: ${selectedTokens
                                  .map((t) => getTokenName(t.item))
                                  .join(", ")}`}
                    </span>
                    <button onClick={refreshSelection}>Refresh selection</button>
                </div>

                <div className={"settings-context vertical"}>
                    <h3>Save the first selected token</h3>
                    <div className={"setting"}>
                        <input
                            placeholder={"Name (defaults to the token's name)"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <button onClick={saveSelected}>Save</button>
                    </div>
                </div>

                <div className={"settings-context vertical"}>
                    <h3>Library</h3>
                    {statblocks.length === 0 ? (
                        <span className={"small"}>
                            Empty. Build an NPC on a token, then save it here to reuse it.
                        </span>
                    ) : (
                        <ul className={"statblock-list"}>
                            {statblocks.map((statblock) => (
                                <li key={statblock.name} className={"setting"}>
                                    <Tippy
                                        content={`${Object.entries(statblock.characteristics)
                                            .map(([k, v]) => `${k} ${v}`)
                                            .join(" · ")} · ${statblock.skills.length} skills · ${
                                            statblock.spells.length
                                        } spells`}
                                    >
                                        <span>{statblock.name}</span>
                                    </Tippy>
                                    <Tippy content={"Apply to every selected token, keeping their damage"}>
                                        <button onClick={() => applyToSelection(statblock)}>Apply</button>
                                    </Tippy>
                                    <Tippy content={"Delete this statblock"}>
                                        <button onClick={() => remove(statblock.name)}>
                                            <DeleteSvg />
                                        </button>
                                    </Tippy>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={"settings-context vertical"}>
                    <h3>Move the library</h3>
                    <div className={"setting"}>
                        <Tippy content={"Copy the whole library to the clipboard as JSON"}>
                            <button onClick={exportLibrary}>
                                <CopySvg /> Export
                            </button>
                        </Tippy>
                    </div>
                    <textarea
                        placeholder={"Paste an exported library here to import it"}
                        rows={3}
                        onBlur={(e) => {
                            if (e.target.value.trim()) {
                                importLibrary(e.target.value);
                                e.target.value = "";
                            }
                        }}
                    />
                </div>

                {message ? <span className={"small"}>{message}</span> : null}
            </div>
        </>
    );
};
