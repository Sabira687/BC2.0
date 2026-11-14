import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Live end-to-end helper, not part of `npm test`. See e2e/README.md.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["e2e/**/*.e2e.ts"], testTimeout: 20_000 },
});
