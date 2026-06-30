import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm"],
  noExternal: [/^@shipflow\//],
  skipNodeModulesBundle: true,
  splitting: false,
  bundle: true,
  outDir: "./dist",
  clean: true,
  env: { IS_SERVER_BUILD: "true" },
  loader: { ".json": "copy" },
  minify: true,
  sourcemap: false,
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
});
