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

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Accept VITE_BASEPATH as "cnp", "/cnp" or "/cnp/"
  function normalizeBaseForVite(input?: string): string {
    const raw = String(input ?? "/cnp").trim();
    const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
    return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
  }

  const base = normalizeBaseForVite(env.VITE_BASEPATH);

  const devBackendTarget =
    (env.CNP_DEV_BACKEND_ORIGIN || env.VITE_BACKEND_URL || env.BACKEND_URL || "")
      .trim()
      .replace(/\/+$/, "");

  if (command === "serve" && !devBackendTarget) {
    throw new Error(
      "Defina CNP_DEV_BACKEND_ORIGIN o VITE_BACKEND_URL antes de ejecutar `npm run dev`."
    );
  }

  const devProxy = devBackendTarget
    ? {
        "/api": {
          target: devBackendTarget,
          changeOrigin: true,
          rewrite: (p: string) => p,
        },
        "/socket.io": {
          target: devBackendTarget,
          changeOrigin: true,
          ws: true,
        },
      }
    : undefined;

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
      proxy: devProxy,
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
