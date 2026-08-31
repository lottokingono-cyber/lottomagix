// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Netlify sets the NETLIFY env var during its builds — emit a Netlify-compatible
  // Nitro preset (functions + redirects under .netlify/) there, keep the default
  // preset (cloudflare-module) elsewhere. This must be a top-level `nitro` option;
  // TanStack Start's own config schema has no `target` field.
  ...(process.env["NETLIFY"] ? { nitro: { preset: "netlify" } } : {}),
});
