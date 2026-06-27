import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "generate-404",
      closeBundle() {
        const distPath = path.resolve(__dirname, "dist");
        const content = `<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0; url=/" /></head>
<body><script>window.location.href="/"</script></body>
</html>`;
        fs.writeFileSync(path.join(distPath, "404.html"), content);

        // Copy _routes.json from project root to dist (Cloudflare Pages needs it in dist/)
        const srcRoutes = path.resolve(__dirname, "_routes.json");
        const dstRoutes = path.join(distPath, "_routes.json");
        if (fs.existsSync(srcRoutes)) {
          fs.copyFileSync(srcRoutes, dstRoutes);
        }
        // Also copy _redirects for CF Pages fallback routing
        const srcRedirects = path.resolve(__dirname, "_redirects");
        const dstRedirects = path.join(distPath, "_redirects");
        if (fs.existsSync(srcRedirects)) {
          fs.copyFileSync(srcRedirects, dstRedirects);
        }
        // Copy _headers for CF Pages response headers
        const srcHeaders = path.resolve(__dirname, "_headers");
        const dstHeaders = path.join(distPath, "_headers");
        if (fs.existsSync(srcHeaders)) {
          fs.copyFileSync(srcHeaders, dstHeaders);
        }
        // Also copy to public for safety
        const publicRedirects = path.resolve(__dirname, "public", "_redirects");
        if (!fs.existsSync(publicRedirects) && fs.existsSync(srcRedirects)) {
          fs.copyFileSync(srcRedirects, publicRedirects);
        }
        // Also copy to public for safety (some CF Pages setups read from here)
        const publicRoutes = path.resolve(__dirname, "public", "_routes.json");
        if (!fs.existsSync(publicRoutes) && fs.existsSync(srcRoutes)) {
          fs.copyFileSync(srcRoutes, publicRoutes);
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    historyApiFallback: true, // SPA routing: redirect all routes to index.html

    proxy: {
      // Proxy Agnes API calls to avoid CORS in dev mode
      "/v1": {
        target: "https://apihub.agnes-ai.com",
        changeOrigin: true,
      },
      // Proxy Cloudflare Worker in dev (if running locally)
      "/api/chat": {
        target: "https://heguimao-api.senliri028.workers.dev",
        changeOrigin: true,
      },
      // Proxy auth API to Cloudflare Worker
      "/api/auth": {
        target: "https://heguimao-api.senliri028.workers.dev",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    minify: false,
    rollupOptions: {
      output: {
        // Force all modules into single chunk to avoid i18n import issues
        manualChunks(id) {
          return 'app'; // everything goes into single app bundle
        },
      },
    },
    // Use esbuild with explicit charset for Windows
    cssCodeSplit: true,
  },
  // Configure esbuild to preserve Unicode characters
  esbuild: {
    charset: 'utf8',
  },
});
