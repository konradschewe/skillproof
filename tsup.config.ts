import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  dts: true,
  sourcemap: true,
  shims: true,
  noExternal: ["@skillproof/ui"],
  esbuildOptions(options) {
    options.loader = { ...options.loader, ".html": "text" };
  },
});
