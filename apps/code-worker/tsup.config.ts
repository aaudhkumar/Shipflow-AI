import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  noExternal: [/^@shipflow\//],
  skipNodeModulesBundle: true,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
});
