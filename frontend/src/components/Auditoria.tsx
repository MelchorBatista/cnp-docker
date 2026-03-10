/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/Auditoria.tsx

import React, { useState, useMemo, useEffect } from "react";
import {
  GlobalStyles,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import apiClient from "../services/apiClient";

interface AuditRecord {
  id: number;
  NombreUsuario: string;
  TipoAccion: string;
  Modulo: string;
  MarcaTiempo: string;
  DireccionIP: string;
  Detalles: string;
}

const Auditoria: React.FC = () => {
  // Estado para los datos de auditoría obtenidos del backend
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de paginación y filtros
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Estado para controlar la visibilidad de las líneas del gráfico
  const [activeLines, setActiveLines] = useState({
    acceso: true,
    critico: true,
    error: true,
  });

  // Fetch de datos de auditoría del backend (ahora vía apiClient con base /api)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchAuditData = async () => {
      try {
        // ✅ relativo a /api, sin localhost hard-coded
        const { data } = await apiClient.get<AuditRecord[]>(
          "/dashboard-auditoria/dashboard-auditoria",
          { signal }
        );
        setAuditData(data);
      } catch (error: any) {
        if (error?.name === "CanceledError" || error?.name === "AbortError") {
          // petición cancelada al desmontar
          return;
        }
        console.error("Error fetching audit data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
    return () => controller.abort();
  }, []);

  // Crear arrays de usuarios y módulos únicos a partir de los datos (removiendo entradas en blanco para usuarios)
  const uniqueUsers = useMemo(
    () =>
      Array.from(
        new Set(
          auditData
            .map((row) => row.NombreUsuario)
            .filter((user) => user.trim() !== "")
        )
      ),
    [auditData]
  );
  const uniqueModules = useMemo(
    () => Array.from(new Set(auditData.map((row) => row.Modulo))),
    [auditData]
  );

  // Filtrado de registros según filtros de usuario, módulo y fecha
  const filteredRows = useMemo(() => {
    return auditData.filter((row) => {
      const matchUser = row.NombreUsuario.toLowerCase().includes(
        searchTerm.toLowerCase()
      );
      const rowDate = new Date(row.MarcaTiempo);
      let matchDate = true;
      if (filterStartDate) {
        matchDate = matchDate && rowDate >= filterStartDate;
      }
      if (filterEndDate) {
        matchDate = matchDate && rowDate <= filterEndDate;
      }
      const matchModule = filterModule === "" || row.Modulo === filterModule;
      return matchUser && matchDate && matchModule;
    });
  }, [auditData, searchTerm, filterModule, filterStartDate, filterEndDate]);

  useEffect(() => {
    console.log("Filtered rows count:", filteredRows.length);
  }, [filteredRows]);

  // Definición de contadores
  const totalAccesos = filteredRows.length;
  const criticalModules = ["Gestión de Usuarios", "Asignaciones"];
  const accionesCriticas = filteredRows.filter((row) =>
    criticalModules.includes(row.Modulo)
  ).length;
  const errorTypes = ["INICIO_SESION_FALLIDO"];
  const errores = filteredRows.filter((row) =>
    errorTypes.includes(row.TipoAccion)
  ).length;

  const kpiData = [
    { title: "Total accesos", value: totalAccesos },
    { title: "Acciones críticas", value: accionesCriticas },
    { title: "Errores", value: errores },
  ];

  // Paginación
  const { page, pageSize } = paginationModel;
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPaginationModel((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPaginationModel({ page: 0, pageSize: parseInt(event.target.value, 10) });
  };

  const cellSx = { whiteSpace: "nowrap", py: 0.5 };
  const headerCellSx = {
    backgroundColor: "#003876",
    color: "#FFFFFF",
    ...cellSx,
    textTransform: "uppercase",
    textAlign: "center",
  };

  // Agrupación para el gráfico
  const aggregatedData = useMemo(() => {
    const groups: Record<
      string,
      { date: string; acceso: number; critico: number; error: number }
    > = {};
    filteredRows.forEach((row) => {
      const dateObj = new Date(row.MarcaTiempo);
      const dateKey = dateObj.toLocaleDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, acceso: 0, critico: 0, error: 0 };
      }
      groups[dateKey].acceso += 1;
      if (criticalModules.includes(row.Modulo)) {
        groups[dateKey].critico += 1;
      }
      if (errorTypes.includes(row.TipoAccion)) {
        groups[dateKey].error += 1;
      }
    });
    return Object.values(groups);
  }, [filteredRows, criticalModules, errorTypes]);

  const toggleLine = (line: "acceso" | "critico" | "error") => {
    setActiveLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }));
  };

  // Definición de colores y nombres para el gráfico
  const lineColors = {
    acceso: "#00C853", // Verde
    critico: "#FFAB00", // Amarillo
    error: "#D50000", // Rojo
  };
  const inactiveColor = "#BDBDBD";

  if (loading) {
    return <Typography>Cargando datos...</Typography>;
  }

  return (
    <>
      <GlobalStyles
        styles={`
          body {
            margin: 0;
            font-family: Roboto, Helvetica, Arial, sans-serif;
          }
        `}
      />
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          backgroundColor: "#F4F4F4",
          minHeight: "100vh",
        }}
      >
        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Stack spacing={2} direction="column">
            <Autocomplete
              freeSolo
              options={uniqueUsers}
              inputValue={searchTerm}
              onInputChange={(_event, newInputValue) =>
                setSearchTerm(newInputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar usuario"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#003876" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel id="modulo-select-label" shrink>
                Módulo
              </InputLabel>
              <Select
                labelId="modulo-select-label"
                label="Módulo"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {uniqueModules.map((modulo) => (
                  <MenuItem key={modulo} value={modulo}>
                    {modulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha inicial"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                filterStartDate
                  ? filterStartDate.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFilterStartDate(
                  e.target.value ? new Date(e.target.value) : null
                )
              }
            />
            <TextField
              label="Fecha final"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={
                filterEndDate ? filterEndDate.toISOString().split("T")[0] : ""
              }
              onChange={(e) =>
                setFilterEndDate(
                  e.target.value ? new Date(e.target.value) : null
                )
              }
            />
          </Stack>
        </Paper>

        {/* Tarjetas KPI */}
        <Stack
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
          sx={{ mb: 2 }}
        >
          {kpiData.map((kpi, index) => (
            <Card
              key={index}
              sx={{
                backgroundColor: "#003876",
                color: "#FFFFFF",
                border: "1px solid #808080",
                transition: "transform 0.2s, box-shadow 0.2s",
                flex: 1,
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: "center",
                  px: 2,
                  pt: 0.5,
                  pb: 0.5,
                  "&:last-child": { pb: 0.5 },
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.5 }}>
                  {kpi.title}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", mb: 0, lineHeight: 1 }}
                >
                  {kpi.value.toLocaleString("en-US")}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Gráfico de Líneas (Responsive) */}
        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#FFFFFF" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={aggregatedData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {activeLines.acceso && (
                <Line
                  type="monotone"
                  dataKey="acceso"
                  stroke={lineColors.acceso}
                  name="ACCESO"
                  isAnimationActive={false}
                />
              )}
              {activeLines.critico && (
                <Line
                  type="monotone"
                  dataKey="critico"
                  stroke={lineColors.critico}
                  name="CRITICO"
                  isAnimationActive={false}
                />
              )}
              {activeLines.error && (
                <Line
                  type="monotone"
                  dataKey="error"
                  stroke={lineColors.error}
                  name="ERROR"
                  isAnimationActive={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        {/* Botones de control para el gráfico */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            onClick={() => toggleLine("acceso")}
            sx={{
              backgroundColor: activeLines.acceso
                ? lineColors.acceso
                : inactiveColor,
              "&:hover": {
                backgroundColor: activeLines.acceso
                  ? lineColors.acceso
                  : inactiveColor,
              },
            }}
          >
            ACCESO
          </Button>
          <Button
            variant="contained"
            onClick={() => toggleLine("critico")}
            sx={{
              backgroundColor: activeLines.critico
                ? lineColors.critico
                : inactiveColor,
              "&:hover": {
                backgroundColor: activeLines.critico
                  ? lineColors.critico
                  : inactiveColor,
              },
            }}
          >
            CRITICO
          </Button>
          <Button
            variant="contained"
            onClick={() => toggleLine("error")}
            sx={{
              backgroundColor: activeLines.error
                ? lineColors.error
                : inactiveColor,
              "&:hover": {
                backgroundColor: activeLines.error
                  ? lineColors.error
                  : inactiveColor,
              },
            }}
          >
            ERROR
          </Button>
        </Box>

        {/* Tabla de Auditoría */}
        <Paper sx={{ p: 2, backgroundColor: "#FFFFFF" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>#</TableCell>
                  {/* ID eliminado */}
                  <TableCell sx={headerCellSx}>Usuario</TableCell>
                  <TableCell sx={headerCellSx}>Acción</TableCell>
                  <TableCell sx={headerCellSx}>Módulo</TableCell>
                  <TableCell sx={headerCellSx}>Fecha / Hora</TableCell>
                  <TableCell sx={headerCellSx}>IP</TableCell>
                  <TableCell sx={headerCellSx}>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, index) => (
                  <TableRow key={`${row.id}-${index}`}>
                    <TableCell sx={cellSx}>
                      {page * pageSize + index + 1}
                    </TableCell>
                    {/* Celda de ID eliminada */}
                    <TableCell sx={cellSx}>{row.NombreUsuario}</TableCell>
                    <TableCell sx={cellSx}>{row.TipoAccion}</TableCell>
                    <TableCell sx={cellSx}>{row.Modulo}</TableCell>
                    <TableCell sx={cellSx}>{row.MarcaTiempo}</TableCell>
                    <TableCell sx={cellSx}>{row.DireccionIP}</TableCell>
                    <TableCell sx={cellSx}>{row.Detalles}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
      </Box>
    </>
  );
};

export default Auditoria;
