/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/SolicitarAcceso.tsx
import React, { useState } from "react";
import DOMPurify from "dompurify";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Container,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Person,
  Mail,
  Phone,
  AssignmentInd,
  Lock,
  Business, // NUEVO
  Apps, // NUEVO
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// 👇 Usar el cliente central en lugar de axios directo
import apiClient from "../services/apiClient";

const SolicitarAcceso: React.FC = () => {
  /* ───────────── hooks ───────────── */
  const navigate = useNavigate();
  const [openErrorDialog, setOpenErrorDialog] = useState(false);

  const [formData, setFormData] = useState({
    correoElectronico: "",
    clave: "",
    confirmarClave: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    cedula: "",
    empresa: "", // NUEVO
    sistema: "", // NUEVO
  });

  const [errors, setErrors] = useState({
    correoElectronico: "",
    clave: "",
    confirmarClave: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    cedula: "",
    empresa: "", // NUEVO (opcional)
    sistema: "", // NUEVO (opcional)
  });

  const [openTerms, setOpenTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  /* ─────────── validación ─────────── */
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validateName = (n: string) => /^[A-Za-záéíóúÁÉÍÓÚñÑ ]+$/.test(n);
  const validatePhone = (p: string) => /^\(\d{3}\)\s\d{3}-\d{4}$/.test(p);
  const validateCedula = (c: string) => /^\d{3}-\d{7}-\d{1}$/.test(c);

  const getClaveError = (c: string) => {
    if (!c) return "La clave es requerida.";
    if (c.length < 8) return "La clave debe tener al menos 8 caracteres.";
    if (!/[A-Z]/.test(c))
      return "La clave debe contener al menos una letra mayúscula.";
    if (!/[0-9]/.test(c)) return "La clave debe contener al menos un número.";
    return "";
  };
  const getConfirmClaveError = (x: string) =>
    !x
      ? "Confirmar clave es requerida."
      : x !== formData.clave
      ? "Las claves no coinciden."
      : "";

  /* ────────── formateo live ───────── */
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").substring(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  const formatCedula = (v: string) => {
    const d = v.replace(/\D/g, "").substring(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
  };
  const sanitizeInput = (i: string) => DOMPurify.sanitize(i);

  /* ────────── handlers campo ──────── */
  const handleChange = (field: keyof typeof formData, val: string) => {
    let v =
      field === "telefono"
        ? formatPhone(val)
        : field === "cedula"
        ? formatCedula(val)
        : val;
    v = sanitizeInput(v);
    setFormData((p) => ({ ...p, [field]: v }));
    validateField(field, v);
  };
  const handleBlur = (f: keyof typeof formData) =>
    validateField(f, formData[f]);

  /* ────────── validación campo ────── */
  const badSQL = [
    /drop\s+table/i,
    /drop\s+database/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+\w+\s+set/i,
    /select\s+\*\s+from/i,
    /union\s+select/i,
    /create\s+database/i,
    /create\s+table/i,
    /alter\s+table/i,
    /truncate\s+table/i,
    /--/i,
    /;/,
    /#/i,
    /\bor\b\s+1\s*=\s*1\b/i,
    /\band\b\s+1\s*=\s*1\b/i,
  ];
  const containsSQL = (s: string) => badSQL.some((p) => p.test(s));

  const validateField = (field: keyof typeof formData, value: string) => {
    let msg = "";
    if (containsSQL(value)) msg = "El campo contiene comandos SQL inválidos.";
    else {
      switch (field) {
        case "correoElectronico":
          if (!validateEmail(value)) msg = "Correo inválido.";
          break;
        case "nombres":
        case "apellidos":
          if (!validateName(value))
            msg = "Sólo letras y espacios. Máx. 50 caracteres.";
          break;
        case "telefono":
          if (!validatePhone(value))
            msg = "Formato teléfono inválido. Ej: (123) 456-7890";
          break;
        case "cedula":
          if (!validateCedula(value))
            msg = "Formato cédula inválido. Ej: 123-4567890-1";
          break;
        case "clave":
          msg = getClaveError(value);
          break;
        case "confirmarClave":
          msg = getConfirmClaveError(value);
          break;
        case "empresa": // NUEVO (opcional)
        case "sistema": // NUEVO (opcional)
          if (value && value.length > 80) msg = "Máximo 80 caracteres.";
          break;
      }
    }
    setErrors((p) => ({ ...p, [field]: msg }));
  };

  /* ───────────── submit ───────────── */
  const handleSubmit = () => {
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((f) =>
      validateField(f, formData[f])
    );
    const hayError = Object.values(errors).some(Boolean);
    const claveErr = getClaveError(formData.clave);
    const confirmErr = getConfirmClaveError(formData.confirmarClave);
    if (hayError || claveErr || confirmErr) {
      setErrors((p) => ({ ...p, clave: claveErr, confirmarClave: confirmErr }));
      setOpenErrorDialog(true);
      return;
    }
    setOpenTerms(true);
  };

  /* ─────────── aceptar términos ───── */
  const handleAcceptTerms = async () => {
    if (!acceptedTerms) return alert("Debe aceptar los términos.");
    try {
      // ✅ Usar el cliente central con baseURL "/api"
      await apiClient.post("/usuarios/solicitar-acceso", {
        correoElectronico: formData.correoElectronico,
        clave: formData.clave,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
        cedula: formData.cedula,
        EMPRESA: formData.empresa || null, // NUEVO
        SISTEMA: formData.sistema || null, // NUEVO
      });

      setOpenTerms(false);
      setAcceptedTerms(false);
      setFormData({
        correoElectronico: "",
        clave: "",
        confirmarClave: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        cedula: "",
        empresa: "", // NUEVO
        sistema: "", // NUEVO
      });
      alert("Solicitud registrada. Revise su correo.");
      navigate("/");
    } catch (err) {
      alert("Error al registrar la solicitud.");
      console.error(err);
    }
  };

  /* ─────────── iconos ─────────────── */
  const icon = (node: JSX.Element) => (
    <InputAdornment position="start">{node}</InputAdornment>
  );
  const black = { color: "#000" };
  const icons = {
    email: icon(<Mail sx={black} />),
    clave: icon(<Lock sx={black} />),
    nombre: icon(<Person sx={black} />),
    apellido: icon(<Person sx={black} />),
    tel: icon(<Phone sx={black} />),
    ced: icon(<AssignmentInd sx={black} />),
    empresa: icon(<Business sx={black} />), // NUEVO
    sistema: icon(<Apps sx={black} />), // NUEVO
  };

  /* ───────────── JSX ──────────────── */
  return (
    <>
      {/* Dialogo de errores (sin título) */}
      <Dialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#FFFFFF",
            textAlign: "center",
          },
        }}
      >
        <DialogContent sx={{ fontWeight: "bold" }}>
          POR FAVOR CORRIJA LOS ERRORES EN EL FORMULARIO
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            onClick={() => setOpenErrorDialog(false)}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
            }}
          >
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* -------- formulario -------- */}
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            backgroundColor: "#FAFAFA",
            borderRadius: 2,
            boxShadow: 3,
            p: 0,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              backgroundColor: "#003876",
              color: "#FFFFFF",
              textAlign: "center",
              py: 1,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            SOLICITAR ACCESO
          </Typography>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {/* correo */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  variant="outlined"
                  type="email"
                  value={formData.correoElectronico}
                  onChange={(e) =>
                    handleChange("correoElectronico", e.target.value)
                  }
                  onBlur={() => handleBlur("correoElectronico")}
                  error={!!errors.correoElectronico}
                  helperText={errors.correoElectronico}
                  InputProps={{ startAdornment: icons.email }}
                />
              </Grid>

              {/* clave */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Clave"
                  variant="outlined"
                  type="password"
                  value={formData.clave}
                  onChange={(e) => handleChange("clave", e.target.value)}
                  onBlur={() => handleBlur("clave")}
                  error={!!errors.clave}
                  helperText={errors.clave}
                  InputProps={{ startAdornment: icons.clave }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar clave"
                  variant="outlined"
                  type="password"
                  value={formData.confirmarClave}
                  onChange={(e) =>
                    handleChange("confirmarClave", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmarClave")}
                  error={!!errors.confirmarClave}
                  helperText={errors.confirmarClave}
                  InputProps={{ startAdornment: icons.clave }}
                />
              </Grid>

              {/* nombres */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombres"
                  variant="outlined"
                  value={formData.nombres}
                  onChange={(e) => handleChange("nombres", e.target.value)}
                  onBlur={() => handleBlur("nombres")}
                  error={!!errors.nombres}
                  helperText={errors.nombres || "Máximo 50 caracteres."}
                  inputProps={{ maxLength: 50 }}
                  InputProps={{ startAdornment: icons.nombre }}
                />
              </Grid>

              {/* apellidos */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  variant="outlined"
                  value={formData.apellidos}
                  onChange={(e) => handleChange("apellidos", e.target.value)}
                  onBlur={() => handleBlur("apellidos")}
                  error={!!errors.apellidos}
                  helperText={errors.apellidos || "Máximo 50 caracteres."}
                  inputProps={{ maxLength: 50 }}
                  InputProps={{ startAdornment: icons.apellido }}
                />
              </Grid>

              {/* cédula */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cédula"
                  variant="outlined"
                  value={formData.cedula}
                  onChange={(e) => handleChange("cedula", e.target.value)}
                  onBlur={() => handleBlur("cedula")}
                  error={!!errors.cedula}
                  helperText={errors.cedula}
                  InputProps={{ startAdornment: icons.ced }}
                />
              </Grid>

              {/* teléfono */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  variant="outlined"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  onBlur={() => handleBlur("telefono")}
                  error={!!errors.telefono}
                  helperText={errors.telefono}
                  InputProps={{ startAdornment: icons.tel }}
                />
              </Grid>

              {/* NUEVO: Empresa */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Empresa (opcional)"
                  variant="outlined"
                  value={formData.empresa}
                  onChange={(e) => handleChange("empresa", e.target.value)}
                  onBlur={() => handleBlur("empresa")}
                  error={!!errors.empresa}
                  helperText={errors.empresa || "Máximo 80 caracteres."}
                  inputProps={{ maxLength: 80 }}
                  InputProps={{ startAdornment: icons.empresa }}
                />
              </Grid>

              {/* NUEVO: Sistema */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sistema (opcional)"
                  variant="outlined"
                  value={formData.sistema}
                  onChange={(e) => handleChange("sistema", e.target.value)}
                  onBlur={() => handleBlur("sistema")}
                  error={!!errors.sistema}
                  helperText={errors.sistema || "Máximo 80 caracteres."}
                  inputProps={{ maxLength: 80 }}
                  InputProps={{ startAdornment: icons.sistema }}
                />
              </Grid>
            </Grid>

            {/* botones */}
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <Button
                onClick={() => navigate(-1)}
                variant="contained"
                sx={{
                  backgroundColor: "#9E9E9E",
                  fontWeight: "bold",
                  color: "#FFFFFF",
                  "&:hover": { backgroundColor: "#EE2A24" },
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                sx={{
                  backgroundColor: "#003876",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#EE2A24" },
                }}
              >
                Solicitar Acceso
              </Button>
            </Box>
          </Box>

          {/* diálogo términos */}
          <Dialog
            open={openTerms}
            onClose={() => setOpenTerms(false)}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { backgroundColor: "#f0f0f0", borderRadius: 2 } }}
          >
            <DialogContent dividers sx={{ backgroundColor: "#FFFFFF" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  mb: 2,
                  color: "#003876",
                }}
              >
                TÉRMINOS Y CONDICIONES
              </Typography>
              <Typography variant="body1" gutterBottom>
                {/* …texto de términos… */}
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    color="primary"
                  />
                }
                label="He leído y acepto los Términos y Condiciones."
              />
            </DialogContent>
            <DialogActions sx={{ backgroundColor: "#f0f0f0" }}>
              <Button
                onClick={() => setOpenTerms(false)}
                variant="contained"
                sx={{ backgroundColor: "#9E9E9E", color: "#FFFFFF" }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAcceptTerms}
                variant="contained"
                disabled={!acceptedTerms}
                sx={{
                  backgroundColor: "#003876",
                  color: "#FFFFFF",
                  "&:hover": { backgroundColor: "#EE2A24" },
                }}
              >
                Aceptar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
};

export default SolicitarAcceso;
