/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/Asignaciones.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BlockIcon from "@mui/icons-material/Block";
import SettingsIcon from "@mui/icons-material/Settings";
import { keyframes } from "@emotion/react";
import { useSelector } from "react-redux";

// Interfaz para el usuario
interface User {
  UsuarioID: number;
  CorreoElectronico: string;
  Nombres: string;
  Apellidos: string;
  Telefono: string;
  Estatus: string;
  TipoUsuario: string;
}

export interface Organismo {
  OrganismoID: number;
  Nombre: string;
  Siglas: string;
  NivelGobierno: string;
  SectorGobierno: string;
  Vigente: boolean;
  FechaCierre?: string;
}

// Funciones de utilidad
const getSiglas = (org: Organismo): string =>
  org.Siglas && org.Siglas.toLowerCase() !== "null" ? org.Siglas : "";

const getDisplayName = (org: Organismo): string => {
  const siglas = getSiglas(org);
  return siglas ? `${org.Nombre} (${siglas})` : org.Nombre;
};

const formatFechaCierre = (fecha: string): string => {
  const date = new Date(fecha);
  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getNivelSector = (nivel: string, sector: string): string => {
  if (!sector || sector.trim().toLowerCase() === "no aplica") {
    return nivel.toUpperCase();
  }
  return `${nivel.toUpperCase()} / ${sector}`;
};

const getUserStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "activado":
      return "#003876";
    case "desactivado":
      return "#000000";
    case "bloqueado":
      return "#EE2A24";
    case "confirmar":
      return "#FFA500";
    default:
      return "#003876";
  }
};

const getOrganismoStatusColor = (vigente: boolean): string =>
  vigente ? "#739619" : "#EE2A24";

const getButtonStyleOrganismo = (vigente: boolean) => ({
  backgroundColor: "#FFFFFF",
  color: getOrganismoStatusColor(vigente),
  border: `1px solid ${getOrganismoStatusColor(vigente)}`,
  fontSize: "0.7rem",
  padding: "2px 6px",
  minWidth: "unset",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
});

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "activado":
      return <CheckCircleIcon sx={{ mr: 1, color: "#008000" }} />;
    case "desactivado":
      return <CancelIcon sx={{ mr: 1, color: "#000000" }} />;
    case "bloqueado":
      return <BlockIcon sx={{ mr: 1, color: "#EE2A24" }} />;
    case "confirmar":
      return <HelpOutlineIcon sx={{ mr: 1, color: "#FFA500" }} />;
    default:
      return <CheckCircleIcon sx={{ mr: 1, color: "#008000" }} />;
  }
};

/**
 * Pantalla de gestión de asignaciones usuario–organismo.
 * Permite listar, crear y eliminar asignaciones desde el frontend.
 * @returns Vista de administración de asignaciones.
 * @author Dionicio Melchor Batista Jerez
 * @lastmod 2026-01-30
 */
const Asignaciones: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [availableOrganisms, setAvailableOrganisms] = useState<Organismo[]>([]);
  // Asignaciones se obtienen de la tabla RNP_Asignaciones (que solo tiene los IDs)
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  // Asignaciones filtradas para el usuario seleccionado
  const [userAssignments, setUserAssignments] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingOrganisms, setLoadingOrganisms] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrganismo, setSelectedOrganismo] = useState<Organismo | null>(
    null
  );
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  // Obtener el usuario logueado desde Redux
  const usuarioLogueado = useSelector((state: any) => state.auth.user);

  // Cargar organismos
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/organismos`)
      .then((res) => res.json())
      .then((data) => {
        const organismosArray = Array.isArray(data)
          ? data
          : data.recordset || [];
        setAvailableOrganisms(organismosArray);
        setLoadingOrganisms(false);
      })
      .catch((err) => {
        console.error("Error al cargar organismos:", err);
        setLoadingOrganisms(false);
      });
  }, []);

  // Cargar usuarios
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`)
      .then((res) => res.json())
      .then((data) => {
        const usersArray = Array.isArray(data) ? data : data.recordset || [];
        setUsers(usersArray);
        setLoadingUsers(false);
      })
      .catch((err) => {
        console.error("Error al cargar usuarios:", err);
        setLoadingUsers(false);
      });
  }, []);

  // Función para obtener asignaciones actualizadas
  const fetchAssignments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/asignaciones`
      );
      if (!res.ok) throw new Error("Error en la red");
      const data = await res.json();
      setAllAssignments(data);
      setLoadingAssignments(false);
      if (selectedUser) {
        const filtered = data.filter(
          (a: any) => a.UsuarioID === selectedUser.UsuarioID
        );
        setUserAssignments(filtered);
      }
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      setAllAssignments([]);
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const filtered = allAssignments.filter(
        (asignacion: any) => asignacion.UsuarioID === selectedUser.UsuarioID
      );
      setUserAssignments(filtered);
    } else {
      setUserAssignments([]);
    }
  }, [selectedUser, allAssignments]);

  const userAutocompleteProps = {
    value: selectedUser,
    options: users,
    getOptionLabel: (option: User) => option.CorreoElectronico,
    onChange: (event: any, value: User | null) => {
      setSelectedUser(value);
      setSelectedOrganismo(null);
    },
    renderOption: (props: any, option: User) => {
      const { key, ...rest } = props;
      return (
        <li key={key} {...rest}>
          {getStatusIcon(option.Estatus)}
          {option.Nombres} {option.Apellidos} - {option.CorreoElectronico}
        </li>
      );
    },
    renderInput: (params: any) => (
      <TextField {...params} label="Buscar usuarios" fullWidth />
    ),
  };

  const organismAutocompleteProps = {
    value: selectedOrganismo,
    options: availableOrganisms,
    getOptionLabel: (option: Organismo) =>
      `${option.OrganismoID} - ${getDisplayName(option)}`,
    onChange: (event: any, value: Organismo | null) => {
      setSelectedOrganismo(value);
    },
    renderInput: (params: any) => (
      <TextField {...params} label="Buscar organismos" fullWidth />
    ),
  };

  // Función para asignar un organismo
  const handleAssignOrganismo = async (org: Organismo) => {
    if (!selectedUser || selectedUser.Estatus.toLowerCase() !== "activado") {
      setErrorDialogMessage(
        "Solo se pueden asignar organismos a usuarios ACTIVADOS"
      );
      setOpenErrorDialog(true);
      return;
    }
    if (!org.Vigente) {
      setErrorDialogMessage(
        "Los organismos que no están vigentes no se pueden asignar"
      );
      setOpenErrorDialog(true);
      return;
    }
    if (userAssignments.some((o) => o.OrganismoID === org.OrganismoID)) return;

    try {
      const payload = {
        usuarioId: selectedUser.UsuarioID,
        organismoId: org.OrganismoID,
        auditor: usuarioLogueado.CorreoElectronico,
        nombreOrganismo: org.Nombre,
        correoUsuario: selectedUser.CorreoElectronico,
      };

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/asignaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchAssignments();
    } catch (error) {
      console.error("Error al asignar organismo", error);
    }
  };

  // Función para remover una asignación utilizando el mismo endpoint (/api/asignaciones)
  // con el método DELETE y enviando el payload en el cuerpo
  const handleRemoveOrganismo = async (index: number) => {
    if (!selectedUser) return;
    const orgToRemove = userAssignments[index];
    // Buscar el organismo completo para obtener su nombre
    const fullOrg = availableOrganisms.find(
      (org: Organismo) => org.OrganismoID === orgToRemove.OrganismoID
    );
    const nombreOrganismo = fullOrg ? fullOrg.Nombre : "";
    try {
      const payload = {
        usuarioId: selectedUser.UsuarioID,
        organismoId: orgToRemove.OrganismoID,
        auditor: usuarioLogueado.CorreoElectronico,
        nombreOrganismo: nombreOrganismo,
        correoUsuario: selectedUser.CorreoElectronico,
      };

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/asignaciones`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetchAssignments();
    } catch (error) {
      console.error("Error al remover asignación", error);
    }
  };

  const handleCloseDialog = () => {
    setOpenErrorDialog(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 100px)",
        pb: 4,
        fontFamily: "Roboto, sans-serif",
        backgroundColor: "#FFFFFF",
        p: 1,
      }}
    >
      <Dialog
        open={openErrorDialog}
        onClose={handleCloseDialog}
        PaperProps={{ sx: { borderRadius: "8px", backgroundColor: "#003876" } }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Typography sx={{ color: "#FFFFFF" }}>
            {errorDialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1, justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={handleCloseDialog}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              "&:hover": {
                backgroundColor: "#EE2A24",
                color: "#FFFFFF",
              },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={1} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={5} sx={{ display: "flex" }}>
          <Box
            sx={{
              flexGrow: 1,
              border: "1px solid #808080",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              mb: "0.2em",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#003876",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderRadius: "8px 8px 0 0",
                  p: 0.5,
                }}
              >
                Usuarios
              </Typography>
            </Box>
            <Box sx={{ p: 1, flexGrow: 1, overflowY: "auto" }}>
              {loadingUsers ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                >
                  <SettingsIcon
                    sx={{
                      fontSize: 40,
                      animation: `${spin} 2s linear infinite`,
                    }}
                  />
                  <Typography variant="body1">Cargando datos ...</Typography>
                </Box>
              ) : (
                <>
                  <Autocomplete {...userAutocompleteProps} sx={{ mb: 1 }} />
                  {selectedUser && (
                    <Paper
                      elevation={3}
                      sx={{
                        mb: 1,
                        backgroundColor: getUserStatusColor(
                          selectedUser.Estatus
                        ),
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        p: 1,
                        width: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <EmailIcon sx={{ mr: 1 }} />
                          <Typography variant="body2" sx={{ fontSize: "1rem" }}>
                            {selectedUser.CorreoElectronico}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <PersonIcon sx={{ mr: 1 }} />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "1.5rem", fontWeight: "bold" }}
                          >
                            {selectedUser.Nombres} {selectedUser.Apellidos}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {getStatusIcon(selectedUser.Estatus)}
                          <Typography variant="body2">
                            {selectedUser.TipoUsuario} / {selectedUser.Estatus}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{ display: "flex" }}>
          <Box
            sx={{
              flexGrow: 1,
              border: "1px solid #808080",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              mb: "0.2em",
            }}
          >
            <Box sx={{ width: "100%" }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#003876",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  textAlign: "center",
                  borderRadius: "8px 8px 0 0",
                  p: 0.5,
                }}
              >
                Organismos
              </Typography>
            </Box>
            <Box sx={{ p: 1, flexGrow: 1, overflowY: "auto", height: "100%" }}>
              {loadingOrganisms ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                >
                  <SettingsIcon
                    sx={{
                      fontSize: 40,
                      animation: `${spin} 2s linear infinite`,
                    }}
                  />
                  <Typography variant="body1">Cargando datos ...</Typography>
                </Box>
              ) : (
                <>
                  <Autocomplete {...organismAutocompleteProps} sx={{ mb: 1 }} />
                  {selectedOrganismo ? (
                    <Paper
                      key={selectedOrganismo.OrganismoID}
                      elevation={3}
                      sx={{
                        mb: 0.5,
                        backgroundColor: getOrganismoStatusColor(
                          selectedOrganismo.Vigente
                        ),
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        p: 1,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{ flexBasis: "85%", overflow: "hidden", pr: 1 }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                          >
                            {getDisplayName(selectedOrganismo)}
                          </Typography>
                          <Typography variant="body2">
                            {getNivelSector(
                              selectedOrganismo?.NivelGobierno || "",
                              selectedOrganismo?.SectorGobierno || ""
                            )}
                          </Typography>
                          {!selectedOrganismo.Vigente &&
                            selectedOrganismo.FechaCierre && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: "bold",
                                  textTransform: "uppercase",
                                }}
                              >
                                Fecha de Cierre:{" "}
                                {formatFechaCierre(
                                  selectedOrganismo.FechaCierre
                                )}
                              </Typography>
                            )}
                        </Box>
                        <Box sx={{ flexBasis: "15%", textAlign: "center" }}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={getButtonStyleOrganismo(
                              selectedOrganismo.Vigente
                            )}
                            onClick={() =>
                              handleAssignOrganismo(selectedOrganismo)
                            }
                            disabled={
                              !selectedUser ||
                              userAssignments.some(
                                (o) =>
                                  o.OrganismoID ===
                                  selectedOrganismo.OrganismoID
                              )
                            }
                          >
                            Asignar
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ textAlign: "center", color: "#808080" }}
                    ></Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Sección de Asignaciones */}
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="h6"
          sx={{
            backgroundColor: "#003876",
            color: "#FFFFFF",
            fontWeight: "bold",
            textAlign: "center",
            borderRadius: "8px",
            p: 1,
          }}
        >
          Asignaciones
        </Typography>
        <Box sx={{ p: 1, overflowY: "auto" }}>
          {selectedUser ? (
            userAssignments.length > 0 ? (
              userAssignments.map((asignacion: any, index: number) => {
                const fullOrg = availableOrganisms.find(
                  (org: Organismo) => org.OrganismoID === asignacion.OrganismoID
                );
                if (!fullOrg) {
                  return (
                    <Paper
                      key={asignacion.OrganismoID}
                      elevation={3}
                      sx={{
                        mb: 0.5,
                        backgroundColor: "#EE2A24",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        p: 1,
                        width: "100%",
                      }}
                    >
                      <Typography variant="subtitle1">
                        Organismo no encontrado
                      </Typography>
                    </Paper>
                  );
                }
                return (
                  <Paper
                    key={fullOrg.OrganismoID}
                    elevation={3}
                    sx={{
                      mb: 0.5,
                      backgroundColor: getOrganismoStatusColor(fullOrg.Vigente),
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      p: 1,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box sx={{ flexBasis: "85%", overflow: "hidden", pr: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                        >
                          {getDisplayName(fullOrg)}
                        </Typography>
                        <Typography variant="body2">
                          {getNivelSector(
                            fullOrg.NivelGobierno || "",
                            fullOrg.SectorGobierno || ""
                          )}
                        </Typography>
                        {!fullOrg.Vigente && fullOrg.FechaCierre && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            }}
                          >
                            Fecha de Cierre:{" "}
                            {formatFechaCierre(fullOrg.FechaCierre)}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ flexBasis: "15%", textAlign: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={getButtonStyleOrganismo(fullOrg.Vigente)}
                          onClick={() => handleRemoveOrganismo(index)}
                        >
                          Remover
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                );
              })
            ) : (
              <Typography
                variant="body2"
                sx={{ textAlign: "center", color: "#808080" }}
              >
                El usuario no tiene asignaciones
              </Typography>
            )
          ) : (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", color: "#808080" }}
            >
              Seleccione un usuario para ver sus asignaciones
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Asignaciones;
