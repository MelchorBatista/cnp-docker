/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/slices/nominaResumidaPoderSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../services/apiClient";

/** Conjunto de valores permitidos (nombres largos) */
export type PoderNombreLargo =
  | "PODER EJECUTIVO"
  | "PODER LEGISLATIVO"
  | "PODER JUDICIAL"
  | "GOBIERNO LOCAL"
  | "ORGANISMO AUTONOMO";

/** DTO aislado para el flujo “Poder del Estado” */
export interface NominaResumidaPoderDTO {
  CodigoOrganismoMAP: string;
  Organismo: string;
  PoderDelEstado: string;
  Anio: number;
  Mes: number;
  Empleados: number;
}

interface State {
  datos: NominaResumidaPoderDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: State = {
  datos: [],
  loading: false,
  error: null,
};

/** Carga resumida por PODER (endpoint separado) */
export const loadNominaResumidaPorPoder = createAsyncThunk<
  NominaResumidaPoderDTO[],
  { year: number; mes: number; poder: PoderNombreLargo },
  { rejectValue: string }
>("nominaResumidaPoder/load", async ({ year, mes, poder }, thunkAPI) => {
  try {
    const url = `/nomina-resumida-poder/${year}/${mes}?poder=${encodeURIComponent(
      poder
    )}`;
    const { data } = await apiClient.get<NominaResumidaPoderDTO[]>(url);
    return data;
  } catch (err: unknown) {
    const e = err as any;
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Error al cargar nómina resumida por poder";
    return thunkAPI.rejectWithValue(msg);
  }
});

const nominaResumidaPoderSlice = createSlice({
  name: "nominaResumidaPoder",
  initialState,
  reducers: {
    clearNominaResumidaPoder: (state) => {
      state.datos = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNominaResumidaPorPoder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNominaResumidaPorPoder.fulfilled, (state, action) => {
        state.loading = false;
        state.datos = action.payload;
      })
      .addCase(loadNominaResumidaPorPoder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Error desconocido al cargar datos";
      });
  },
});

export const { clearNominaResumidaPoder } = nominaResumidaPoderSlice.actions;
export default nominaResumidaPoderSlice.reducer;
