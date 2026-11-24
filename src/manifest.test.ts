/** The Owlbear Rodeo manifest's field limits. */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = JSON.parse(readFileSync(resolve(__dirname, "../public/manifest.json"), "utf-8"));

/**
 * Owlbear Rodeo rejects a manifest whose description exceeds this, with
 * "description length must be less than or equal to 128 characters long".
 *
 * The limit is enforced when the extension is added to a room, not at build time, so
 * without this test an over-long description ships, deploys green, and fails only in
 * front of the person trying to install it.
 */
const MAX_DESCRIPTION = 128;

describe("the manifest", () => {
    it("test_the_description_fits_owlbear_rodeos_128_character_limit", () => {
        expect(manifest.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    });

    it("test_every_window_the_manifest_points_at_is_built", () => {
        // These paths must match vite.config.ts's rollup inputs, or the extension
        // installs and then opens a blank window.
        expect(manifest.background_url).toBe("/background.html");
        expect(manifest.action.popover).toBe("/");
    });

    it("test_the_manifest_declares_a_name_and_an_icon", () => {
        expect(manifest.name.length).toBeGreaterThan(0);
        expect(manifest.icon.length).toBeGreaterThan(0);
    });
});
