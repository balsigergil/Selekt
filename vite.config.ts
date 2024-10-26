import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      name: "Selektt",
      fileName: "selektt",
    },
  },
});
