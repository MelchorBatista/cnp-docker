/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/socket.ts
import { io, Socket } from "socket.io-client";

/**
 * Normalize basepath for BrowserRouter/IIS.
 * - Default "/cnp" when VITE_BASEPATH is missing
 * - Returns without trailing slash (e.g., "/cnp")
 */
function normalizeBase(input: unknown): string {
  const raw = String(input ?? "/cnp").trim();
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, "");
}

const basepath = normalizeBase((import.meta as any).env?.VITE_BASEPATH);

// Environment flags
const isProd = (import.meta as any).env?.PROD === true;
const isDev = (import.meta as any).env?.DEV === true;

function originFromUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u);
    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return u.replace(/\/+$/, "");
  }
}

/**
 * Prod (IIS):
 *   - Same origin, path "/cnp/socket.io"
 * Dev:
 *   - Prefer VITE_SOCKET_URL
 *   - Else use origin from VITE_BACKEND_URL (without path)
 *   - Else use same origin and rely on the Vite proxy
 *   - Path "/socket.io" (no basepath)
 */
let url: string | undefined = undefined;
let path = "/socket.io";

if (isProd) {
  url = undefined; // same origin
  path = `${basepath}/socket.io`; // => "/cnp/socket.io"
} else if (isDev) {
  const socketEnv = (import.meta as any).env?.VITE_SOCKET_URL;
  const backendOrigin = originFromUrl((import.meta as any).env?.VITE_BACKEND_URL);

  url =
    (socketEnv && socketEnv.trim().length > 0
      ? socketEnv.trim()
      : backendOrigin) || undefined;
  path = "/socket.io";
}

// Optional: token in handshake
const token = (() => {
  try {
    return localStorage.getItem("token") || undefined;
  } catch {
    return undefined;
  }
})();

export const socket: Socket = io(url as any, {
  path,
  transports: ["websocket", "polling"],
  withCredentials: true,
  auth: token ? { token } : undefined,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on("connect", () => {
  // console.log("[socket] connected:", socket.id);
});
socket.on("connect_error", (err) => {
  // console.error("[socket] connect_error:", err?.message || err);
});
socket.on("reconnect_attempt", () => {
  // console.log("[socket] reconnecting...");
});

export default socket;
