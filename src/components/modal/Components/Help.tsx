import { useEffect, useState } from "react";
import help from "../../../../USAGE.md";
import { Markdown } from "../../general/Markdown.tsx";
import { modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";

export const Help = () => {
    const [helpText, setHelpText] = useState<string>("");

    useEffect(() => {
        fetch(help)
            .then((res) => res.text())
            .then((text) => setHelpText(text));
    }, []);
    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            {/*
                The Patreon is the upstream author's, inherited with the port. "Supporting
                me" would be asking the reader for money under our name and sending it to
                someone else, so the credit names them instead.
            */}
            <div className={"patreon"} style={{ fontSize: "0.8rem" }}>
                Ported from Joshua Hercher's{" "}
                <a href={"https://github.com/kamejosh/gm-daggerheart"} target={"_blank"}>
                    gm-daggerheart
                </a>
                . Consider supporting them on{" "}
                <a href={"https://www.patreon.com/TTRPGAPI"} target={"_blank"}>
                    Patreon
                </a>
                .
            </div>
            <Markdown text={helpText} />
        </>
    );
};
