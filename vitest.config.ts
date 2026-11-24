/**
 * Test configuration for the rules layer.
 *
 * Deliberately separate from `vite.config.ts`: that config exists to build an Owlbear
 * Rodeo extension and loads mkcert to serve the dev manifest over https, neither of
 * which a unit test run needs. Only `src/rules/` is collected, because it is the only
 * layer that is pure enough to test without a virtual tabletop.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/rules/**/*.test.ts", "src/*.test.ts"],
        environment: "node",
    },
});
