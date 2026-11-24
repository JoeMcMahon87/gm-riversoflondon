import { defineConfig } from "vite";
import { resolve } from "path";
import mkcert from "vite-plugin-mkcert";
import copy from "rollup-plugin-copy";

declare var __dirname: string;
export default defineConfig({
    /**
     * `cors` is required: Owlbear Rodeo loads the manifest cross-origin from the dev
     * server. `host` is deliberately left at Vite's localhost default, so a clone does
     * not publish someone's dev server to their whole network; set it per-machine with
     * `vite --host` when serving to another device.
     */
    server: { cors: true },
    assetsInclude: ["**/*.md"],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                popover: resolve(__dirname, "popover.html"),
                background: resolve(__dirname, "background.html"),
                modal: resolve(__dirname, "modal.html"),
                rolllog: resolve(__dirname, "rolllog.html"),
            },
            /**
             * Ignore "use client" waning since we are not using SSR
             * @see {@link https://github.com/TanStack/query/pull/5161#issuecomment-1477389761 Preserve 'use client' directives TanStack/query#5161}
             */
            onwarn(warning, warn) {
                if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes(`"use client"`)) {
                    return;
                }
                warn(warning);
            },
        },
    },
    plugins: [
        mkcert(),
        copy({
            targets: [{ src: resolve(__dirname, "_headers"), dest: "dist/" }],
            hook: "writeBundle",
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler", // or "modern", "legacy"
            },
        },
    },
});
