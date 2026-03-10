/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// frontend/src/components/Encabezado.tsx

import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import {
  Menu as MenuIcon,
  PersonAdd,
  Help,
  Assessment,
  CloudUpload,
  AssignmentInd,
} from "@mui/icons-material";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, setSelectedOption } from "../slices/authSlice";

const SubirNominaJSON = lazy(() => import("./SubirNominaJSON"));

function Encabezado() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 600px)");

  const { token, role, error } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ---------------------------------------------------------------- effects */

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => {}, 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* -------------------------------------------------------------- handlers */

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  /** Ir siempre al dashboard (logo y textos) */
  const handleHomeClick = () => {
    if (isMobile) setDrawerOpen(false);
    navigate("/dashboard");
  };

  /**
   * 1. Siempre navega primero a /dashboard.
   * 2. Luego navega a la ruta específica (salvo SubirNomina que abre modal).
   * 3. Actualiza selectedOption para que Principal actúe.
   * 4. Cierra el drawer en móvil.
   */
  const handleMenuItemClick = (action: string) => {
    dispatch(setSelectedOption(action));

    navigate("/dashboard");

    if (action === "SubirNomina") {
      setOpen(true);
    } else if (action === "Usuarios") {
      navigate(`/gestionar-usuarios?refresh=${Date.now()}`);
    } else if (action === "SolicitarAcceso") {
      navigate("/solicitar-acceso");
    } else if (action === "Asignaciones") {
      navigate("/asignaciones");
    } else if (action === "Auditoria") {
      navigate("/auditoria");
    } else if (action === "Estadisticas") {
      navigate("/estadisticas");
    } else if (action === "Reportes") {
      navigate("/reporte-nomina");
    }

    if (isMobile) setDrawerOpen(false);
  };

  /* -------------------------------------------------------------- menu data */

  const menuItemsLoggedIn = {
    Administrador: [
      { text: "Usuarios", icon: <PersonAdd />, action: "Usuarios" },
      { text: "Asignaciones", icon: <AssignmentInd />, action: "Asignaciones" },
      { text: "Subir Nómina", icon: <CloudUpload />, action: "SubirNomina" },
      // { text: "Estadísticas", icon: <Assessment />, action: "Estadisticas" },
      { text: "Reportes", icon: <DescriptionIcon />, action: "Reportes" },
      { text: "Auditoría", icon: <HistoryIcon />, action: "Auditoria" },
      { text: "Ayuda", icon: <Help />, action: "Ayuda" },
    ],
    Institucional: [
      { text: "Subir Nómina", icon: <CloudUpload />, action: "SubirNomina" },
      // { text: "Estadísticas", icon: <Assessment />, action: "Estadisticas" },
      { text: "Reportes", icon: <DescriptionIcon />, action: "Reportes" },
      { text: "Ayuda", icon: <Help />, action: "Ayuda" },
    ],
    Consulta: [
      // { text: "Estadísticas", icon: <Assessment />, action: "Estadisticas" },
      { text: "Reportes", icon: <DescriptionIcon />, action: "Reportes" },
      { text: "Ayuda", icon: <Help />, action: "Ayuda" },
    ],
    "Mesa de Ayuda": [
      { text: "Usuarios", icon: <PersonAdd />, action: "Usuarios" },
      { text: "Asignaciones", icon: <AssignmentInd />, action: "Asignaciones" },
      { text: "Subir Nómina", icon: <CloudUpload />, action: "SubirNomina" },
      // { text: "Estadísticas", icon: <Assessment />, action: "Estadisticas" },
      { text: "Reportes", icon: <DescriptionIcon />, action: "Reportes" },
      { text: "Auditoría", icon: <HistoryIcon />, action: "Auditoria" },
      { text: "Ayuda", icon: <Help />, action: "Ayuda" },
    ],
  } as Record<string, { text: string; icon: JSX.Element; action: string }[]>;

  /* -------------------------------------------------------------- styles */

  const drawerButtonStyle = {
    padding: "10px",
    borderRadius: 0,
    width: "100%",
    justifyContent: "flex-start",
    "&:hover": {
      backgroundColor: "#EE2A24",
      "& .MuiTypography-root, & .MuiSvgIcon-root": { color: "white" },
    },
    "&:focus-visible": {
      outline: "none",
      backgroundColor: "#EE2A24",
      "& .MuiTypography-root, & .MuiSvgIcon-root": { color: "white" },
    },
  };

  const horizontalButtonStyle = {
    padding: "8px 16px",
    borderRadius: "4px",
    color: "white",
    backgroundColor: "transparent",
    "&:hover": { backgroundColor: "#EE2A24", color: "white" },
    "&:focus-visible": {
      outline: "none",
      backgroundColor: "#EE2A24",
      color: "white",
      "& .MuiTypography-root, & .MuiSvgIcon-root": { color: "white" },
    },
  };

  /* -------------------------------------------------------------- helpers */

  const renderMenuItems = (items: any[], isDrawer: boolean) =>
    items.map(({ text, icon, action }) => (
      <IconButton
        key={text}
        color="inherit"
        sx={isDrawer ? drawerButtonStyle : horizontalButtonStyle}
        onClick={() => handleMenuItemClick(action)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleMenuItemClick(action);
          }
        }}
        aria-label={text}
      >
        {icon}
        <Typography
          variant="body2"
          sx={{
            ml: 1,
            color: isDrawer ? "black" : "white",
            transition: "color 0.3s",
          }}
        >
          {text}
        </Typography>
      </IconButton>
    ));

  /* -------------------------------------------------------------- render */

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "#003876", width: "100%", zIndex: 1300 }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            sx={{ display: drawerOpen ? "none" : "block" }}
          >
            <MenuIcon sx={{ color: "white" }} />
          </IconButton>
        )}

        {/* Logo y título: ahora todos clicables */}
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <img
            src="https://uxkit.digital.gob.do/images/gob-icon.svg"
            alt="Logo"
            onClick={handleHomeClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleHomeClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Ir al dashboard"
            style={{
              height: 36,
              width: "auto",
              marginRight: 8,
              cursor: "pointer",
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="h6"
              onClick={handleHomeClick}
              sx={{
                cursor: "pointer",
                color: "white",
                fontSize: "0.75rem",
                lineHeight: 0.8,
              }}
            >
              Complementario
            </Typography>
            <Typography
              variant="h4"
              onClick={handleHomeClick}
              sx={{
                cursor: "pointer",
                color: "white",
                fontWeight: "bold",
                fontSize: "1.25rem",
                lineHeight: 0.95,
              }}
            >
              Nómina Pública
            </Typography>
          </Box>
        </Box>

        {/* Menú horizontal en escritorio */}
        {!drawerOpen && !isMobile && token && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, ml: "auto" }}>
            {renderMenuItems(menuItemsLoggedIn[role] ?? [], false)}
          </Box>
        )}
      </Toolbar>

      {/* Menú en Drawer para móvil */}
      {isMobile && token && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{ "& .MuiDrawer-paper": { width: 250 } }}
        >
          <Box sx={{ p: 2 }}>
            {renderMenuItems(menuItemsLoggedIn[role] ?? [], true)}
          </Box>
        </Drawer>
      )}

      {/* Modal de carga de nómina */}
      {open && (
        <Suspense fallback={<div>Cargando...</div>}>
          <SubirNominaJSON open={open} setOpen={setOpen} />
        </Suspense>
      )}
    </AppBar>
  );
}

export default Encabezado;
