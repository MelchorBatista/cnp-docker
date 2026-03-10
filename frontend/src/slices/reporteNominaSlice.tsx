/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/modules/reporteNomina/slices/reporteNominaSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchReporteNominaOrganismos,
  fetchReporteNominaAnios,
  fetchReporteNominaMeses,
  fetchReporteNominaPorMes,
  downloadReporteNominaPdf,
  Organismo,
  NominaDato,
} from "../services/ReporteNominaService";

interface ReporteNominaState {
  organismos: Organismo[];
  anios: number[];
  meses: number[];
  datos: NominaDato[];
  loadingOrganismos: boolean;
  loadingAnios: boolean;
  loadingMeses: boolean;
  loadingDatos: boolean;
  error?: string;
}

const initialState: ReporteNominaState = {
  organismos: [],
  anios: [],
  meses: [],
  datos: [],
  loadingOrganismos: false,
  loadingAnios: false,
  loadingMeses: false,
  loadingDatos: false,
  error: undefined,
};

export const loadOrganismos = createAsyncThunk<Organismo[]>(
  "reporteNomina/loadOrganismos",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchReporteNominaOrganismos();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadAnios = createAsyncThunk<number[], number>(
  "reporteNomina/loadAnios",
  async (organismoId, { rejectWithValue }) => {
    try {
      return await fetchReporteNominaAnios({ organismoId });
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadMeses = createAsyncThunk<
  number[],
  { organismoId: number; year: number }
>(
  "reporteNomina/loadMeses",
  async ({ organismoId, year }, { rejectWithValue }) => {
    try {
      return await fetchReporteNominaMeses({ organismoId, year });
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadPorMes = createAsyncThunk<
  NominaDato[],
  { organismoId: number; year: number; mes: number }
>("reporteNomina/loadPorMes", async (params, { rejectWithValue }) => {
  try {
    return await fetchReporteNominaPorMes(params);
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const downloadPdf = createAsyncThunk<
  Blob,
  { organismoId: number; year: number; mes: number }
>("reporteNomina/downloadPdf", async (params, { rejectWithValue }) => {
  try {
    return await downloadReporteNominaPdf(params);
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

const slice = createSlice({
  name: "reporteNomina",
  initialState,
  reducers: {
    clearDatos(state) {
      state.datos = [];
      state.error = undefined;
    },
    clearAnios(state) {
      state.anios = [];
    },
    clearMeses(state) {
      state.meses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Organismos
      .addCase(loadOrganismos.pending, (state) => {
        state.loadingOrganismos = true;
        state.error = undefined;
      })
      .addCase(
        loadOrganismos.fulfilled,
        (state, action: PayloadAction<Organismo[]>) => {
          state.loadingOrganismos = false;
          state.organismos = action.payload;
        }
      )
      .addCase(loadOrganismos.rejected, (state, action) => {
        state.loadingOrganismos = false;
        state.error = action.payload as string;
      })
      // Años
      .addCase(loadAnios.pending, (state) => {
        state.loadingAnios = true;
        state.error = undefined;
        state.anios = [];
      })
      .addCase(
        loadAnios.fulfilled,
        (state, action: PayloadAction<number[]>) => {
          state.loadingAnios = false;
          state.anios = action.payload;
        }
      )
      .addCase(loadAnios.rejected, (state, action) => {
        state.loadingAnios = false;
        state.error = action.payload as string;
      })
      // Meses
      .addCase(loadMeses.pending, (state) => {
        state.loadingMeses = true;
        state.error = undefined;
        state.meses = [];
      })
      .addCase(
        loadMeses.fulfilled,
        (state, action: PayloadAction<number[]>) => {
          state.loadingMeses = false;
          state.meses = action.payload;
        }
      )
      .addCase(loadMeses.rejected, (state, action) => {
        state.loadingMeses = false;
        state.error = action.payload as string;
      })
      // Datos
      .addCase(loadPorMes.pending, (state) => {
        state.loadingDatos = true;
        state.error = undefined;
      })
      .addCase(
        loadPorMes.fulfilled,
        (state, action: PayloadAction<NominaDato[]>) => {
          state.loadingDatos = false;
          state.datos = action.payload;
        }
      )
      .addCase(loadPorMes.rejected, (state, action) => {
        state.loadingDatos = false;
        state.error = action.payload as string;
      })
      // PDF
      .addCase(downloadPdf.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearDatos, clearAnios, clearMeses } = slice.actions;
export default slice.reducer;
