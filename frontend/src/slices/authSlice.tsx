/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

interface Usuario {
  CorreoElectronico: string;
  TipoUsuario: string;
  Estatus?: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    CorreoElectronico: string;
    TipoUsuario: string;
    Estatus?: string;
  };
}

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  selectedOption: string | null;
  error: string | null;
  lastErrorCode: string | null; // p.ej. "USER_STATUS"
  lastEstatus: string | null; // p.ej. "Bloqueado"
}

// Endpoints relativos a la base del apiClient (que será "/api" en el server)
const LOGIN_ENDPOINT =
  (import.meta as any).env?.VITE_LOGIN_ENDPOINT || "/auth/login";

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  selectedOption: null,
  error: null,
  lastErrorCode: null,
  lastEstatus: null,
};

export const loginAsync = createAsyncThunk<
  LoginResponse,
  { username: string; password: string },
  { rejectValue: { error: string; code?: string; estatus?: string } }
>("auth/loginAsync", async ({ username, password }, thunkAPI) => {
  try {
    // ✅ Usamos apiClient con endpoint relativo; baseURL viene de apiClient
    const response = await apiClient.post<LoginResponse>(LOGIN_ENDPOINT, {
      username,
      password,
    });
    return response.data;
  } catch (err: any) {
    // Manejo robusto sin depender de tipos concretos de axios
    const status: number | undefined = err?.response?.status;
    const data = err?.response?.data;

    // Si tu backend envía un bloqueo por estatus de usuario
    if (status === 403 || status === 423) {
      const estatus = data?.estatus || data?.Estatus || "Bloqueado";
      return thunkAPI.rejectWithValue({
        error: data?.message || "Usuario no autorizado",
        code: "USER_STATUS",
        estatus,
      });
    }

    const message =
      data?.message || err?.message || "Error al intentar iniciar sesión";

    return thunkAPI.rejectWithValue({ error: message });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      state.lastErrorCode = null;
      state.lastEstatus = null;
      // Limpia storage si lo usas
      try {
        localStorage.removeItem("token");
      } catch {}
    },
    setSelectedOption(state, action: PayloadAction<string | null>) {
      state.selectedOption = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
      state.lastErrorCode = null;
      state.lastEstatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.error = null;
        state.lastErrorCode = null;
        state.lastEstatus = null;
      })
      .addCase(
        loginAsync.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.role = action.payload.user.TipoUsuario;
          state.error = null;
          state.lastErrorCode = null;
          state.lastEstatus = null;

          // Guarda token si quieres persistirlo
          try {
            localStorage.setItem("token", action.payload.token);
          } catch {}
        }
      )
      .addCase(loginAsync.rejected, (state, action) => {
        const payload = action.payload as
          | { error: string; code?: string; estatus?: string }
          | undefined;

        if (payload?.code === "USER_STATUS") {
          // Bloqueo por estatus: deja que la UI muestre diálogo específico
          state.error = null;
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.role = null;
          state.lastErrorCode = payload.code || null;
          state.lastEstatus = payload.estatus || null;
          return;
        }

        state.error = payload?.error || "Error en el login";
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.role = null;
        state.lastErrorCode = null;
        state.lastEstatus = null;
      });
  },
});

export const { logout, setSelectedOption, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
