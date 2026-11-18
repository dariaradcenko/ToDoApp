import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// These URLs belong to the homepage. Serve its HTML when one is refreshed,
// while leaving / and the original task app alone.
function serveHomepageRoutes(server) {
  server.middlewares.use((request, _response, next) => {
    const url = new URL(request.url, "http://localhost");
    if (["/overview", "/reminders", "/discussions"].includes(url.pathname)) {
      request.url = "/homepage.html" + url.search;
    }
    next();
  });
}

// Build just the homepage without importing or changing the original task app.
export default defineConfig({
  plugins: [react(), {
    name: "homepage-routes",
    configureServer: serveHomepageRoutes,
    configurePreviewServer: serveHomepageRoutes,
  }],
  optimizeDeps: { entries: ["homepage.html"] },
  build: {
    outDir: "dist/homepage",
    rolldownOptions: {
      input: fileURLToPath(new URL("./homepage.html", import.meta.url)),
    },
  },
});
