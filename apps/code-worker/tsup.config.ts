import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  noExternal: ["@shipflow/db", "@shipflow/services", "@shipflow/logger", "@shipflow/ai", "@shipflow/github"],
});
