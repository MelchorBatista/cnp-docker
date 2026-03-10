/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// /frontend/vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Accept VITE_BASEPATH as "cnp", "/cnp" or "/cnp/"
  function normalizeBaseForVite(input?: string): string {
    const raw = String(input ?? "/cnp").trim();
    const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
    return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
  }

  const base = normalizeBaseForVite(env.VITE_BASEPATH);

  // Backend URL resolution for DEV proxy:
  // 1) VITE_BACKEND_URL (full http://host:port)
  // 2) VITE_DEV_BACKEND_PORT / PORT envs
  // 3) Fallback to http://localhost:28444 (your backend’s port)
  const resolvedPort = env.VITE_DEV_BACKEND_PORT || env.PORT || "28444";

  const backendUrl =
    env.VITE_BACKEND_URL && env.VITE_BACKEND_URL.trim().length > 0
      ? env.VITE_BACKEND_URL.trim()
      : `http://localhost:${resolvedPort}`;

  return {
    base, // e.g., "/cnp/"
    plugins: [react()],
    resolve: {
      alias: {
        "jwt-decode/build/jwt-decode.umd.js": "jwt-decode",
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: backendUrl, // ← dev proxy to your backend
          changeOrigin: true,
          rewrite: (p) => p,
        },
      },
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
    optimizeDeps: {
      include: ["jwt-decode"],
    },
  };
});
