/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/services/apiClient.ts
import axios from "axios";

/**
 * Resolve API base:
 * - En producción: usar VITE_BACKEND_URL + VITE_API_BASE_URL
 * - En desarrollo: usar VITE_API_BASE_URL o fallback
 */
const rawBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim();
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || "/api").trim();

function normalizeApiBase(input: string): string {
  if (!input) return "/api";
  if (/^https?:\/\//i.test(input)) return input;
  return input.startsWith("/") ? input : `/${input}`;
}

function combineBackendAndApi(backend: string, api: string): string {
  const apiBase = normalizeApiBase(api);

  if (!backend) return apiBase;

  if (/^https?:\/\//i.test(apiBase)) {
    return apiBase.replace(/\/+$/, "");
  }

  const backendTrimmed = backend.replace(/\/+$/, "");
  if (backendTrimmed.toLowerCase().endsWith(apiBase.toLowerCase())) {
    return backendTrimmed;
  }

  return `${backendTrimmed}${apiBase}`;
}

const BASE_URL = combineBackendAndApi(rawBackendUrl, rawApiBase);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  // withCredentials: true,
});

/* ───────────────────────────────────────────────
   Lazy store injection to avoid circular deps
   ─────────────────────────────────────────────── */
type ReduxStore = { getState: () => any };
let _store: ReduxStore | null = null;
export const injectStore = (store: ReduxStore) => {
  _store = store;
};

/* ───────────────────────────────────────────────
   REQUEST interceptor: add Authorization if present
   ─────────────────────────────────────────────── */
apiClient.interceptors.request.use((config: any) => {
  try {
    const token: string | null = _store?.getState?.().auth?.token ?? null;
    if (token) {
      config.headers = config.headers ?? {};
      if (!("Authorization" in config.headers)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // silent fail
  }
  return config;
});

/* ───────────────────────────────────────────────
   RESPONSE interceptor: bubble errors up
   ─────────────────────────────────────────────── */
apiClient.interceptors.response.use(
  (r) => r,
  (error) => Promise.reject(error)
);

/* ───────────────────────────────────────────────
   Validation fetch (encrypted payload)
   ─────────────────────────────────────────────── */
export type EncryptedValidationPayload = {
  iv: string;
  cipher: string;
  tag: string;
};

function toRelative(path?: string): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.replace(/^\/+/, "");
}

function isString(x: unknown): x is string {
  return typeof x === "string" && x.length > 0;
}

function isEncryptedPayload(x: any): x is EncryptedValidationPayload {
  return (
    x &&
    typeof x === "object" &&
    typeof x.iv === "string" &&
    typeof x.cipher === "string" &&
    typeof x.tag === "string"
  );
}

export function fetchEncryptedValidationData(
  uuidKey: ArrayBuffer | Uint8Array | string
): Promise<EncryptedValidationPayload>;
export function fetchEncryptedValidationData(
  url: string,
  uuidKey: ArrayBuffer | Uint8Array | string
): Promise<EncryptedValidationPayload>;

export async function fetchEncryptedValidationData(
  a: any,
  b?: any
): Promise<EncryptedValidationPayload> {
  const envEndpoint = (import.meta as any).env?.VITE_VALIDATION_ENDPOINT as
    | string
    | undefined;

  const candidatesRaw: (string | undefined)[] = [
    envEndpoint?.trim(),
    "validation/encrypt",
    "auth/validate",
    "validation/validate",
    "validation",
  ];
  const candidates: string[] = candidatesRaw.filter(isString).map(toRelative);

  let explicitUrl: string | undefined;
  let uuidKey: ArrayBuffer | Uint8Array | string;

  if (typeof a === "string" && b !== undefined) {
    explicitUrl = a;
    uuidKey = b;
  } else {
    uuidKey = a;
  }

  const tryList: { method: "POST" | "GET"; path: string }[] = [];

  if (explicitUrl) {
    const p = toRelative(explicitUrl);
    if (/\/validate\/?$/i.test(p)) {
      tryList.push({ method: "POST", path: p });
    } else {
      tryList.push({ method: "POST", path: p }, { method: "GET", path: p });
    }
  }

  for (const p of candidates) {
    if (p === "validation") {
      tryList.push({ method: "GET", path: p });
    } else {
      tryList.push({ method: "POST", path: p });
    }
  }

  let lastErr: unknown = undefined;
  const recoverableStatus = new Set([400, 403, 404, 405, 410, 415, 422, 501]);

  for (const { method, path } of tryList) {
    try {
      if (method === "POST") {
        const { data } = await apiClient.post(path, uuidKey as any, {
          headers: { "Content-Type": "application/octet-stream" },
          responseType: "json",
        });

        if (isEncryptedPayload(data)) return data;
        if (isEncryptedPayload((data as any)?.data)) return (data as any).data;

        throw new Error("Validation payload shape mismatch on POST " + path);
      } else {
        const { data } = await apiClient.get(path, { responseType: "json" });

        if (isEncryptedPayload(data)) return data;
        if (isEncryptedPayload((data as any)?.data)) return (data as any).data;

        if (import.meta.env.MODE === "development") {
          console.warn(
            `[Validation] Unexpected GET response from /${path}:`,
            data
          );
        }

        throw new Error("Validation payload shape mismatch on GET " + path);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (
        recoverableStatus.has(Number(status)) ||
        /shape mismatch/i.test(String(err?.message ?? ""))
      ) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export default apiClient;
