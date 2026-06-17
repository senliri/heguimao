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
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      // Proxy API requests to Vercel serverless functions (prod only; in dev they go to /v1 proxy)
      "/api": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      // Proxy Agnes API calls to avoid CORS in dev mode
      "/v1": {
        target: "https://apihub.agnes-ai.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1/, '/v1'),
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          // Split compliance data into its own chunk
          // so it's only loaded when a route actually imports it
          if (id.includes('src/data/site')) {
            return 'site-data';
          }
          if (id.includes('src/data/compliance-data')) {
            return 'compliance-data';
          }
        },
      },
    },
  },
});
