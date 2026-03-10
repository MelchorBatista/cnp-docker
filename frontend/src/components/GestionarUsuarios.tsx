/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/GestionarUsuarios.tsx
import React, { useEffect, useState, ChangeEvent, useCallback } from "react";
import {
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TextField,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Switch,
  Select,
  MenuItem,
  Typography,
  Box,
  FormControlLabel,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
// NUEVO: iconos para Empresa y Sistema
import BusinessIcon from "@mui/icons-material/Business"; // NUEVO
import AppsIcon from "@mui/icons-material/Apps"; // NUEVO
// NUEVO: ícono para Reingreso (cambio de clave)
import VpnKeyIcon from "@mui/icons-material/VpnKey"; // NUEVO

interface Usuario {
  UsuarioID: string;
  CorreoElectronico: string;
  Clave: string;
  Nombres: string;
  Apellidos: string;
  Telefono: string;
  Cedula: string;
  ConfirmacionCedula: boolean;
  ConfirmacionCorreo: boolean;
  ConfirmacionTelefono: boolean;
  DobleAutenticacion: boolean;
  IntentosFallidos: number;
  Bloqueo: boolean;
  RazonBloqueo: string;
  Estatus: string;
  FechaSolicitud: Date | null;
  FechaActivacion: Date | null;
  FechaBloqueo: Date | null;
  CodigoTemporalCorreo: string;
  TipoUsuario: string;
  EMPRESA?: string | null; // NUEVO
  SISTEMA?: string | null; // NUEVO
}

const COLOR_AZUL_OSCURO = "#003876";
const COLOR_AZUL_CIELO = "#00AADC";
const COLOR_ROJO = "#EE2A24";
const COLOR_NEGRO = "#000000";
const COLOR_NARANJA = "orange";

const GestionarUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const rowsPerPage = 15;
  const location = useLocation();

  /* ------------------------------------------------------------------ */
  /*  Obtener usuarios                                                  */
  /* ------------------------------------------------------------------ */
  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Usuario[] = await res.json();
      const normalizados = data.map((u) => ({
        ...u,
        FechaSolicitud: u.FechaSolicitud ? new Date(u.FechaSolicitud) : null,
        FechaActivacion: u.FechaActivacion ? new Date(u.FechaActivacion) : null,
        FechaBloqueo: u.FechaBloqueo ? new Date(u.FechaBloqueo) : null,
      }));
      setUsuarios(normalizados);
    } catch (e) {
      console.error("Error al obtener usuarios:", e);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [location.search, fetchUsuarios]);

  /* ------------------------------------------------------------------ */
  /*  Buscador y paginación                                             */
  /* ------------------------------------------------------------------ */
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (
      u.CorreoElectronico.toLowerCase().includes(s) ||
      u.Nombres.toLowerCase().includes(s) ||
      u.Apellidos.toLowerCase().includes(s)
    );
  });

  const paginatedUsuarios = filteredUsuarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  /* ------------------------------------------------------------------ */
  /*  Edición de un usuario                                             */
  /* ------------------------------------------------------------------ */
  const handleRowClick = (u: Usuario) => {
    setSelectedUsuario(u);
    setOpenDialog(true);
  };

  const handleFieldChange = (field: keyof Usuario, value: any) => {
    if (selectedUsuario) {
      setSelectedUsuario({ ...selectedUsuario, [field]: value });
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    setSelectedUsuario(null);
  };

  /* ------------------------------------------------------------------ */
  /*  Guardar cambios                                                   */
  /* ------------------------------------------------------------------ */
  const handleGuardar = async () => {
    if (!selectedUsuario) return;

    const {
      UsuarioID,
      CorreoElectronico, // NUEVO (lo enviaremos para auditoría)
      Nombres,
      Apellidos,
      Telefono,
      Cedula,
      ConfirmacionCedula,
      ConfirmacionCorreo,
      ConfirmacionTelefono,
      Estatus,
      TipoUsuario,
      RazonBloqueo,
      EMPRESA, // NUEVO
      SISTEMA, // NUEVO
    } = selectedUsuario;

    const payload = {
      Nombres,
      Apellidos,
      Telefono,
      Cedula,
      ConfirmacionCedula,
      ConfirmacionCorreo,
      ConfirmacionTelefono,
      Estatus,
      TipoUsuario,
      RazonBloqueo,
      EMPRESA, // NUEVO
      SISTEMA, // NUEVO
      CorreoElectronico, // NUEVO ← importante para registrarAuditoria
    };

    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch(`/api/usuarios/${UsuarioID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const texto = await res.text();
        throw new Error(`HTTP ${res.status}: ${texto}`);
      }

      await fetchUsuarios(); // refrescar listado desde BD
      setOpenDialog(false);
      setSelectedUsuario(null);
    } catch (e) {
      console.error("Error guardando usuario:", e);
      alert("No se pudo guardar el usuario. Revisa la consola y los logs.");
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers de UI                                                     */
  /* ------------------------------------------------------------------ */
  const renderStatusIcon = (s: string) => {
    switch (s) {
      case "Pendiente":
        return <HourglassEmptyIcon sx={{ color: COLOR_AZUL_CIELO }} />;
      case "Confirmar":
        return <InfoIcon sx={{ color: COLOR_NARANJA }} />;
      case "Activado":
        return <CheckCircleIcon sx={{ color: "green" }} />;
      case "Desactivado":
        return <CancelIcon sx={{ color: COLOR_NEGRO }} />;
      case "Bloqueado":
        return <CancelIcon sx={{ color: COLOR_ROJO }} />;
      // NUEVO: estado para cambio de clave
      case "Reingreso":
        return <VpnKeyIcon sx={{ color: COLOR_NARANJA }} />;
      default:
        return null;
    }
  };

  const sectionTitleStyle = {
    display: "inline-block",
    borderBottom: `2px solid ${COLOR_AZUL_OSCURO}`,
    paddingBottom: 0,
    marginBottom: 0,
    width: "100%",
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <Container>
      {/* Barra de búsqueda */}
      <TextField
        label="Buscar usuario"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton>
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          marginTop: "1em",
          marginBottom: 2,
          "& .MuiOutlinedInput-root": { backgroundColor: "#FFFFFF" },
        }}
      />

      {/* Tabla */}
      <Table>
        <TableHead>
          <TableRow sx={{ minHeight: 30 }}>
            {[
              "Correo electrónico",
              "Nombres",
              "Apellidos",
              "Tipo",
              "Estatus",
            ].map((h) => (
              <TableCell
                key={h}
                sx={{
                  backgroundColor: COLOR_AZUL_OSCURO,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  textAlign: h === "Estatus" ? "center" : "left",
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsuarios.map((u) => (
            <TableRow
              key={u.UsuarioID}
              sx={{
                minHeight: 30,
                userSelect: "none",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#FFF9C4" },
              }}
              onClick={() => handleRowClick(u)}
            >
              <TableCell
                sx={{
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {renderStatusIcon(u.Estatus)}
                {u.CorreoElectronico}
              </TableCell>
              <TableCell sx={{ padding: "4px 8px" }}>{u.Nombres}</TableCell>
              <TableCell sx={{ padding: "4px 8px" }}>{u.Apellidos}</TableCell>
              <TableCell sx={{ padding: "4px 8px" }}>{u.TipoUsuario}</TableCell>
              <TableCell sx={{ padding: "4px 8px", textAlign: "center" }}>
                {u.Estatus}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        rowsPerPageOptions={[rowsPerPage]}
        component="div"
        count={filteredUsuarios.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
      />

      {/* Diálogo de edición */}
      <Dialog
        open={openDialog}
        onClose={(_, reason) => {
          if (reason !== "backdropClick") handleCancel();
        }}
        disableEscapeKeyDown
      >
        <DialogTitle
          sx={{
            backgroundColor: COLOR_AZUL_OSCURO,
            color: "#FFFFFF",
            fontWeight: "bold",
            textTransform: "uppercase",
            textAlign: "center",
            py: 0.5,
          }}
        >
          Editar Usuario
        </DialogTitle>

        <DialogContent dividers>
          {selectedUsuario && (
            <Grid container spacing={2}>
              {/* Configuración de la cuenta */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Configuración de la cuenta
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Correo electrónico"
                  fullWidth
                  value={selectedUsuario.CorreoElectronico}
                  sx={{ backgroundColor: "#F4F4F4" }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Clave"
                  fullWidth
                  type="password"
                  value={selectedUsuario.Clave}
                  sx={{ backgroundColor: "#F4F4F4" }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="tipo-usuario-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-usuario-label"
                    label="Tipo de usuario"
                    value={selectedUsuario.TipoUsuario}
                    onChange={(e) =>
                      handleFieldChange("TipoUsuario", e.target.value)
                    }
                    startAdornment={
                      <InputAdornment position="start">
                        <SupervisorAccountIcon />
                      </InputAdornment>
                    }
                  >
                    {[
                      "Administrador",
                      "Institucional",
                      "Consulta",
                      "Mesa de Ayuda",
                    ].map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="estatus-label">Estatus</InputLabel>
                  <Select
                    labelId="estatus-label"
                    label="Estatus"
                    value={selectedUsuario.Estatus}
                    onChange={(e) =>
                      handleFieldChange("Estatus", e.target.value)
                    }
                    startAdornment={
                      <InputAdornment position="start">
                        {renderStatusIcon(selectedUsuario.Estatus)}
                      </InputAdornment>
                    }
                  >
                    {[
                      "Activado",
                      "Desactivado",
                      "Bloqueado",
                      "Reingreso", // NUEVO
                      "Confirmar",
                      "Pendiente",
                    ].map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Razón del bloqueo"
                  fullWidth
                  multiline
                  rows={3}
                  value={selectedUsuario.RazonBloqueo}
                  onChange={(e) =>
                    handleFieldChange("RazonBloqueo", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ReportProblemIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Confirmaciones */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Confirmaciones
                </Typography>
              </Grid>
              {[
                {
                  label: "Cédula",
                  field: "ConfirmacionCedula",
                  checked: selectedUsuario.ConfirmacionCedula,
                },
                {
                  label: "Correo",
                  field: "ConfirmacionCorreo",
                  checked: selectedUsuario.ConfirmacionCorreo,
                },
                {
                  label: "Teléfono",
                  field: "ConfirmacionTelefono",
                  checked: selectedUsuario.ConfirmacionTelefono,
                },
              ].map(({ label, field, checked }) => (
                <Grid item xs={4} key={field}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={checked}
                        onChange={(e) =>
                          handleFieldChange(
                            field as keyof Usuario,
                            e.target.checked
                          )
                        }
                        color="primary"
                      />
                    }
                    label={label}
                  />
                </Grid>
              ))}

              {/* Datos personales */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Datos personales
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Nombres"
                  fullWidth
                  value={selectedUsuario.Nombres}
                  onChange={(e) => handleFieldChange("Nombres", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Apellidos"
                  fullWidth
                  value={selectedUsuario.Apellidos}
                  onChange={(e) =>
                    handleFieldChange("Apellidos", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Cédula"
                  fullWidth
                  value={selectedUsuario.Cedula}
                  onChange={(e) => handleFieldChange("Cedula", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  value={selectedUsuario.Telefono}
                  onChange={(e) =>
                    handleFieldChange("Telefono", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* NUEVO: Empresa / Sistema */}
              <Grid item xs={6}>
                <TextField
                  label="Empresa"
                  fullWidth
                  value={selectedUsuario.EMPRESA ?? ""}
                  onChange={(e) => handleFieldChange("EMPRESA", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sistema"
                  fullWidth
                  value={selectedUsuario.SISTEMA ?? ""}
                  onChange={(e) => handleFieldChange("SISTEMA", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AppsIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Datos históricos */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Datos históricos
                </Typography>
              </Grid>
              {[
                {
                  label: "Fecha de la solicitud",
                  value: selectedUsuario.FechaSolicitud,
                },
                {
                  label: "Fecha de activación",
                  value: selectedUsuario.FechaActivacion,
                },
                {
                  label: "Fecha de bloqueo",
                  value: selectedUsuario.FechaBloqueo,
                },
              ].map(({ label, value }) => (
                <Grid item xs={6} key={label}>
                  <TextField
                    label={label}
                    fullWidth
                    type="date"
                    value={value ? value.toISOString().split("T")[0] : ""}
                    sx={{ backgroundColor: "#F4F4F4" }}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              ))}
              <Grid item xs={6}>
                <TextField
                  label="Código temporal"
                  fullWidth
                  value={selectedUsuario.CodigoTemporalCorreo}
                  sx={{ backgroundColor: "#F4F4F4" }}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={handleCancel}
              sx={{
                backgroundColor: "#d3d3d3",
                color: "#000000",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#EE2A24",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                },
              }}
            >
              CANCELAR
            </Button>
            <Button
              onClick={handleGuardar}
              sx={{
                backgroundColor: "#003876",
                color: "#FFFFFF",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#EE2A24",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                },
              }}
            >
              GUARDAR
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GestionarUsuarios;
