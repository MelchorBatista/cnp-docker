/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
import React, { useMemo, useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Paper,
  Typography,
  Grid,
} from "@mui/material";
import {
  AccountBalance,
  Gavel,
  Balance,
  LocationCity,
  Lan,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { ALL_INSTITUTIONS, InstitutionType } from "./EstadisticasEjemplo";

/* Alto reservado para un pie de página fijo (si lo hubiera) */
const FOOTER_HEIGHT = 40;

/* ---------- utilidades ---------- */
const format = (n: number) => n.toLocaleString("es-DO");

const colorScale = (p: number, summary = false) => {
  if (isNaN(p)) return summary ? "#455a64" : "#607d8b"; // gris
  if (p >= 90) return summary ? "#388e3c" : "#4caf50"; // verde
  if (p >= 70) return summary ? "#f57c00" : "#ff9800"; // naranja
  return summary ? "#d32f2f" : "#f44336"; // rojo
};

/* Colores del texto para el porcentaje global */
const textColorScale = (p: number) => {
  if (isNaN(p)) return "#bdbdbd";
  if (p >= 90) return "#66bb6a";
  if (p >= 70) return "#ffa726";
  return "#ef5350";
};

/* ---------- iconos por tipo ---------- */
const typeIcon: Record<InstitutionType, JSX.Element> = {
  "Poder Ejecutivo": <AccountBalance fontSize="inherit" />,
  "Poder Legislativo": <Gavel fontSize="inherit" />,
  "Poder Judicial": <Balance fontSize="inherit" />,
  "Gobiernos Locales": <LocationCity fontSize="inherit" />,
  "Organismos Autónomos": <Lan fontSize="inherit" />,
};

/* ---------- styled-components que replican el mock-up ---------- */
const CardBase = styled(Paper)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  backgroundColor: bgcolor,
  color: theme.palette.common.white,
  borderRadius: 8,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  transition: "box-shadow .25s ease, transform .15s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,.1)",
  "&:hover": {
    boxShadow: "0 5px 15px rgba(0,0,0,.2)",
    transform: "translateY(-2px)",
  },
}));

const CardHeaderRoot = styled(Box)({
  display: "flex",
  alignItems: "stretch",
  cursor: "pointer",
  padding: "8px 0 8px 16px",
  position: "relative",
  userSelect: "none",
});

const PercentageSection = styled(Box)({
  display: "flex",
  alignItems: "center",
  paddingRight: 8,
});
const DividerVertical = styled("span")({
  width: 1,
  backgroundColor: "rgba(255,255,255,.4)",
  margin: "0 8px",
});
const NameSection = styled(Box)({
  flexGrow: 1,
  display: "flex",
  alignItems: "center",
  paddingRight: 12,
});
const IconSection = styled(Box)({
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0,
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
});
const ExpandIconButton = styled(IconButton)<{ expanded: boolean }>(
  ({ expanded }) => ({
    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform .2s",
    fontSize: "1.75rem",
    color: "inherit",
  })
);

/* Header vertical para tarjetas resumen */
const SummaryHeader = styled(CardHeaderRoot)({
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "16px 16px 8px 16px",
});

/* Fila reutilizable de detalle */
const InfoRow: React.FC<{ label: string; value: number | string }> = ({
  label,
  value,
}) => (
  <Box
    display="flex"
    alignItems="baseline"
    mb={0.75}
    lineHeight={1.3 as unknown as string}
  >
    <Typography
      fontWeight={700}
      mr={1}
      minWidth={70}
      textAlign="right"
      fontSize="0.875rem"
    >
      {typeof value === "number" ? format(value) : value}
    </Typography>
    <Typography fontSize="0.875rem">{label}</Typography>
  </Box>
);

/* ========================================================= */
const Estadisticas: React.FC = () => {
  const drawerWidth = 240;

  const [filter, setFilter] = useState<InstitutionType | null>(null);
  const [expanded, setExpanded] = useState<Record<string | number, boolean>>(
    {}
  );

  /* ---------- resúmenes por categoría ---------- */
  const summaries = useMemo(() => {
    const build = (type: InstitutionType) => {
      const g = ALL_INSTITUTIONS.filter((i) => i.type === type);
      const avg = g.reduce((s, i) => s + i.percentage, 0) / g.length;
      return {
        type,
        totalInstitutions: g.length,
        totalAttempts: g.reduce((s, i) => s + i.attempts, 0),
        totalSuccessful: g.reduce((s, i) => s + i.successful, 0),
        totalFailed: g.reduce((s, i) => s + i.failed, 0),
        totalEmployees: g.reduce((s, i) => s + i.employeeCount, 0),
        averagePercentage: avg,
      };
    };
    return (Object.keys(typeIcon) as InstitutionType[]).map(build);
  }, []);

  const globalAvg =
    ALL_INSTITUTIONS.reduce((acc, i) => acc + i.percentage, 0) /
    ALL_INSTITUTIONS.length;

  /* ---------- sidebar ---------- */
  const drawerItems = (Object.keys(typeIcon) as InstitutionType[]).map((t) => (
    <ListItemButton
      key={t}
      selected={filter === t}
      onClick={() => setFilter(t)}
      sx={{ py: 0.5, pl: 1, pr: 1 }} // menos padding
    >
      <ListItemIcon sx={{ color: "inherit", minWidth: 28, mr: 0.5 }}>
        {typeIcon[t]}
      </ListItemIcon>
      <ListItemText primary={t} sx={{ my: 0 }} />
    </ListItemButton>
  ));

  const dataToShow = filter
    ? ALL_INSTITUTIONS.filter((i) => i.type === filter)
    : summaries;

  const toggleExpand = (k: string | number) =>
    setExpanded((p) => ({ ...p, [k]: !p[k] }));

  /* ---------- JSX ---------- */
  return (
    <Box display="flex" height={`calc(100vh - ${FOOTER_HEIGHT}px)`}>
      {/* ======== MENÚ LATERAL ======== */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            bgcolor: "#003876",
            color: "#fff",
            position: "relative",
            height: "100%",
            borderRight: "none",
          },
        }}
      >
        <Box p={2} display="flex" flexDirection="column" height="100%">
          <Typography
            fontSize="1rem"
            onClick={() => setFilter(null)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              mb: 1,
              pb: 1,
              textAlign: "center",
              borderBottom: "1px solid #60a5fa",
              "&:hover": { color: "#a7c7f5" },
            }}
          >
            Gobierno Dominicano
          </Typography>

          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              mt: 1,
              mb: 3,
              lineHeight: 1,
              textAlign: "center",
              color: textColorScale(globalAvg),
            }}
          >
            {globalAvg.toFixed(1)}%
          </Typography>

          <Box flexGrow={1} overflow="auto">
            <List>{drawerItems}</List>
          </Box>
        </Box>
      </Drawer>

      {/* ======== CONTENIDO PRINCIPAL ======== */}
      <Box flexGrow={1} ml={1} pr={2} pt={2} overflow="auto">
        <Grid container spacing={2} alignItems="stretch">
          {dataToShow.map((item) => {
            const isSummary = "averagePercentage" in item;
            const key = isSummary ? item.type : item.id;
            const pct = isSummary ? item.averagePercentage : item.percentage;
            const bg = colorScale(pct, isSummary);

            /* ---------- TARJETA RESUMEN ---------- */
            if (isSummary) {
              return (
                <Grid item xs={12} sm={6} lg={4} key={key}>
                  <CardBase bgcolor={bg}>
                    <SummaryHeader onClick={() => toggleExpand(key)}>
                      <IconSection>
                        <ExpandIconButton
                          expanded={!!expanded[key]}
                          size="large"
                        >
                          <ExpandMoreIcon fontSize="inherit" />
                        </ExpandIconButton>
                      </IconSection>
                      <Box fontSize="3rem" mb={0.5} display="block">
                        {typeIcon[item.type as InstitutionType]}
                      </Box>
                      <Typography
                        fontWeight={700}
                        fontSize="1.1rem"
                        textTransform="uppercase"
                        mb={0}
                        width="100%"
                      >
                        {item.type}
                      </Typography>
                      <Typography
                        fontWeight={900}
                        fontSize="3.5rem"
                        lineHeight={1}
                        mb={0.5}
                        width="100%"
                      >
                        {pct.toFixed(1)}%
                      </Typography>
                    </SummaryHeader>

                    <Collapse in={!!expanded[key]} timeout="auto" unmountOnExit>
                      <Box px={2} pb={3}>
                        <InfoRow
                          label="Instituciones"
                          value={item.totalInstitutions}
                        />
                        <InfoRow
                          label="Empleados"
                          value={item.totalEmployees}
                        />
                        <InfoRow
                          label="Intentos Carga"
                          value={item.totalAttempts}
                        />
                        <InfoRow
                          label="Nóminas Fallidas"
                          value={item.totalFailed}
                        />
                        <InfoRow
                          label="Nóminas Exitosas"
                          value={item.totalSuccessful}
                        />
                      </Box>
                    </Collapse>
                  </CardBase>
                </Grid>
              );
            }

            /* ---------- TARJETA DETALLE ---------- */
            return (
              <Grid item xs={12} sm={6} lg={4} key={key}>
                <CardBase bgcolor={bg}>
                  <CardHeaderRoot onClick={() => toggleExpand(key)}>
                    <PercentageSection>
                      <Typography
                        fontWeight={900}
                        fontSize="1.25rem"
                        lineHeight={1.2 as unknown as string}
                      >
                        {pct.toFixed(1)}%
                      </Typography>
                    </PercentageSection>
                    <DividerVertical />
                    <NameSection>
                      <Typography
                        fontWeight={700}
                        fontSize="1rem"
                        lineHeight={1.3 as unknown as string}
                        textTransform="uppercase"
                      >
                        {item.name}
                      </Typography>
                    </NameSection>
                    <IconSection>
                      <ExpandIconButton expanded={!!expanded[key]} size="large">
                        <ExpandMoreIcon fontSize="inherit" />
                      </ExpandIconButton>
                    </IconSection>
                  </CardHeaderRoot>

                  <Collapse in={!!expanded[key]} timeout="auto" unmountOnExit>
                    <Box px={2} pb={3}>
                      <InfoRow
                        label="Intentos de carga"
                        value={item.attempts}
                      />
                      <InfoRow label="Nóminas fallidas" value={item.failed} />
                      <InfoRow
                        label="Nóminas exitosas"
                        value={item.successful}
                      />
                      <InfoRow label="Empleados" value={item.employeeCount} />
                    </Box>
                  </Collapse>
                </CardBase>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default Estadisticas;
