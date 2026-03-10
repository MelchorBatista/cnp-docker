/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/slices/nominaResumidaSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

export interface NominaResumidaDTO {
  CodigoOrganismoMAP: string;
  Organismo: string;
  Anio: number;
  Mes: number;
  Empleados: number;
}

interface NominaResumidaState {
  datos: NominaResumidaDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: NominaResumidaState = {
  datos: [],
  loading: false,
  error: null,
};

/* ────────────────────────────────────────────────────────────── */
/* Thunk: cargar nómina resumida por año/mes + filtros opcionales */
/* ────────────────────────────────────────────────────────────── */
export const loadNominaResumida = createAsyncThunk<
  NominaResumidaDTO[],
  { year: number; mes: number; organismoId?: number; poder?: string },
  { rejectValue: string }
>(
  "nominaResumida/loadNominaResumida",
  async ({ year, mes, organismoId, poder }, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (organismoId !== undefined)
        params.append("organismoId", String(organismoId));
      if (poder) params.append("poder", poder);

      const qs = params.toString();
      const url = qs
        ? `/nomina-resumida/${year}/${mes}?${qs}`
        : `/nomina-resumida/${year}/${mes}`;

      const { data } = await apiClient.get<NominaResumidaDTO[]>(url);
      return data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error al cargar nómina resumida";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

/* ────────────────────────────────────────────────────────────── */
/* Slice                                                           */
/* ────────────────────────────────────────────────────────────── */
const nominaResumidaSlice = createSlice({
  name: "nominaResumida",
  initialState,
  reducers: {
    clearDatosResumida: (state) => {
      state.datos = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNominaResumida.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNominaResumida.fulfilled, (state, action) => {
        state.loading = false;
        state.datos = action.payload;
      })
      .addCase(loadNominaResumida.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Error desconocido";
      });
  },
});

export const { clearDatosResumida } = nominaResumidaSlice.actions;
export default nominaResumidaSlice.reducer;
