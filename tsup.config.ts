import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["cjs"],
  target: "node22",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
