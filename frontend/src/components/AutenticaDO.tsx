/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/AutenticaDO.tsx
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  InputAdornment,
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { useSelector } from "react-redux";
import { loginAsync, clearAuthError } from "../slices/authSlice";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  WarningAmber as WarningAmberIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../hooks/hooks";

// ====== Utilidades de validación ======
const isValidEmail = (email: string): boolean => {
  const regex = /^[a-z0-9._-]+@[a-z0-9_.-]+$/;
  return regex.test(email);
};

const forbiddenSQLCommands = [
  "select",
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "exec",
];

const containsSQLCommand = (email: string): boolean => {
  const atIndex = email.indexOf("@");
  if (atIndex > 0) {
    const userPart = email.substring(0, atIndex).toLowerCase();
    return forbiddenSQLCommands.includes(userPart);
  }
  return false;
};

// ====== Mensajes por Estatus ======
const STATUS_MESSAGES: Record<string, string> = {
  desactivado:
    "Su usuario está desactivado. Comuníquese con servicio técnico del MAP.",
  bloqueado:
    "Su usuario tiene un bloqueo temporal. Comuníquese con servicio técnico del MAP para resolver el inconveniente.",
  reingreso: "Debe cambiar su clave para utilizar el portal.",
  confirmar:
    "Su usuario está en proceso de confirmación. Recibirá un correo cuando pueda utilizar el portal.",
  pendiente:
    "El usuario ha sido creado recientemente y está pendiente de confirmación. Recibirá un correo cuando pueda utilizar el portal.",
};

// ====== Config API (con fallback correcto) ======
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:3000/api";
const STATUS_ENDPOINT =
  import.meta.env.VITE_STATUS_ENDPOINT?.toString() || `${API_BASE}/auth/status`;
const CHANGE_PASSWORD_ENDPOINT =
  import.meta.env.VITE_CHANGE_PASSWORD_ENDPOINT?.toString() ||
  `${API_BASE}/auth/change-password`;

/** Traductor de errores del backend → Español (para login y errores generales) */
function translateBackendError(
  rawError: unknown,
  opts?: { httpStatus?: number; code?: string | null; estatus?: string | null }
): string {
  const msgStr =
    typeof rawError === "string"
      ? rawError
      : typeof (rawError as any)?.message === "string"
      ? (rawError as any).message
      : "";

  const code = (opts?.code || "").toUpperCase();
  const estatus = (opts?.estatus || "").toLowerCase();
  let http = opts?.httpStatus;

  // Extra: parsear "Request failed with status code 401" si viene como string
  if (!http && msgStr) {
    const m = msgStr.match(/status\s*code\s*(\d{3})/i);
    if (m) http = Number(m[1]);
  }

  // Casos especiales de estatus de usuario
  if (code === "USER_STATUS") {
    if (estatus === "reingreso")
      return "Debe cambiar su clave para utilizar el portal.";
    return (
      STATUS_MESSAGES[estatus] ||
      "Su usuario no está habilitado para iniciar sesión en este momento."
    );
  }

  // Errores de red
  if (/network error/i.test(msgStr) || /failed to fetch/i.test(msgStr)) {
    return "No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.";
  }
  if (/timeout/i.test(msgStr)) {
    return "La solicitud excedió el tiempo de espera. Intente nuevamente.";
  }

  // Mensajes típicos en inglés
  const msg = msgStr.toUpperCase();
  if (msg.includes("INVALID CREDENTIALS") || msg.includes("INVALID_PASSWORD")) {
    return "Credenciales inválidas. Verifique su correo y contraseña.";
  }
  if (msg.includes("USER NOT FOUND") || msg.includes("USER_NOT_FOUND")) {
    return "Usuario no encontrado.";
  }
  if (
    msg.includes("EMAIL NOT CONFIRMED") ||
    msg.includes("EMAIL_NOT_CONFIRMED")
  ) {
    return "Debe confirmar su correo antes de iniciar sesión.";
  }
  if (msg.includes("ACCOUNT LOCKED") || msg.includes("LOCKED")) {
    return "Su cuenta está bloqueada temporalmente. Intente más tarde o contacte soporte.";
  }
  if (msg.includes("PASSWORD EXPIRED") || msg.includes("PASSWORD_EXPIRED")) {
    return "Su contraseña ha expirado. Debe actualizarla para continuar.";
  }
  if (msg.includes("MFA REQUIRED") || msg.includes("MFA_REQUIRED")) {
    return "Se requiere verificación adicional para completar el acceso.";
  }
  if (msg.includes("TOKEN EXPIRED") || msg.includes("TOKEN_EXPIRED")) {
    return "Su sesión ha expirado. Vuelva a iniciar sesión.";
  }
  if (msg.includes("TOKEN INVALID") || msg.includes("INVALID_TOKEN")) {
    return "Token inválido. Vuelva a iniciar sesión.";
  }
  if (msg.includes("VALIDATION") || msg.includes("UNPROCESSABLE")) {
    return "Algunos datos no son válidos. Verifique e intente nuevamente.";
  }
  if (msg.includes("RATE LIMIT") || msg.includes("TOO MANY REQUESTS")) {
    return "Demasiados intentos. Espere un momento y vuelva a intentarlo.";
  }
  if (msg.includes("DB") || msg.includes("DATABASE") || msg.includes("SQL")) {
    return "Error interno de base de datos. Intente más tarde.";
  }

  // Mapeo por código HTTP
  switch (http) {
    case 400:
      return "Solicitud inválida. Verifique los datos ingresados.";
    case 401:
      return "Credenciales inválidas. Verifique su correo y contraseña.";
    case 403:
      return "Acceso denegado. Su usuario no tiene permisos para continuar.";
    case 404:
      return "Recurso no encontrado.";
    case 409:
      return "Conflicto con los datos enviados.";
    case 410:
      return "Enlace o recurso no disponible.";
    case 422:
      return "Datos inválidos. Verifique la información enviada.";
    case 423:
      return "Su usuario no está habilitado para iniciar sesión en este momento.";
    case 429:
      return "Demasiados intentos. Espere un momento y vuelva a intentarlo.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Error interno del servidor. Intente más tarde.";
  }

  // Fallback genérico
  return msgStr && msgStr.trim().length > 0
    ? msgStr
    : "Ocurrió un error al procesar su solicitud. Intente nuevamente.";
}

/** Lee el estatus del usuario SIN validar clave */
async function fetchUserStatus(username: string): Promise<string | null> {
  if (!username) return null;
  try {
    const url =
      STATUS_ENDPOINT.includes("?") || STATUS_ENDPOINT.endsWith("/")
        ? `${STATUS_ENDPOINT}username=${encodeURIComponent(username)}`
        : `${STATUS_ENDPOINT}?username=${encodeURIComponent(username)}`;

    const resGet = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (resGet.ok) {
      const data = await resGet.json();
      const raw =
        data?.Estatus ?? data?.estatus ?? data?.Status ?? data?.status ?? null;
      return typeof raw === "string" ? raw.trim() : null;
    }

    // fallback POST si el GET no está habilitado
    const resPost = await fetch(STATUS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!resPost.ok) return null;
    const data = await resPost.json();
    const raw =
      data?.Estatus ?? data?.estatus ?? data?.Status ?? data?.status ?? null;
    return typeof raw === "string" ? raw.trim() : null;
  } catch {
    return null;
  }
}

function AutenticaDO() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Diálogo por estatus (general)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusKey, setStatusKey] = useState<string>("");

  // Diálogo de error global (azul, sin título)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  // Diálogo de cambio de clave (Reingreso)
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSaving, setChangePassSaving] = useState(false);
  const [changePassSuccess, setChangePassSuccess] = useState(false);

  // Cargando
  const [submitting, setSubmitting] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // ---- Estado Redux (incluye fallback desde el slice para 423 USER_STATUS) ----
  const { token, user, error, lastErrorCode, lastEstatus, httpStatus } =
    useSelector(
      (state: {
        auth: {
          token: string | null;
          user: any;
          error: string | null;
          lastErrorCode: string | null;
          lastEstatus: string | null;
          httpStatus?: number | null;
        };
      }) => state.auth
    );

  // Navegar solo si se autenticó y el usuario está activado
  useEffect(() => {
    if (!token || !user) return;
    const rawStatus: unknown = (user as any)?.Estatus ?? (user as any)?.estatus;
    const normalized =
      typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : "";
    if (normalized === "activado") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    }
  }, [token, user, navigate]);

  // Fallback: si el backend respondió 423 (USER_STATUS)
  useEffect(() => {
    if (lastErrorCode === "USER_STATUS") {
      const normalized = (lastEstatus || "").trim().toLowerCase();
      if (normalized === "reingreso") {
        openChangePasswordDialog();
      } else {
        const msg =
          STATUS_MESSAGES[normalized] ||
          "Su usuario no está habilitado para iniciar sesión en este momento.";
        setStatusKey(normalized);
        setStatusMessage(msg);
        setStatusDialogOpen(true);
      }
    }
  }, [lastErrorCode, lastEstatus]);

  // Mostrar errores de login del slice en el diálogo azul (traducción incluida)
  useEffect(() => {
    if (!error) return;
    if (statusDialogOpen || changePassOpen) return;

    const translated = translateBackendError(error, {
      httpStatus: httpStatus ?? undefined,
      code: lastErrorCode,
      estatus: lastEstatus,
    });
    setErrorDialogMessage(translated);
    setErrorDialogOpen(true);
  }, [
    error,
    httpStatus,
    lastErrorCode,
    lastEstatus,
    statusDialogOpen,
    changePassOpen,
  ]);

  if (token) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") e.preventDefault();
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const lowerRaw = rawValue.toLowerCase();

    let sanitizedValue: string;
    if (lowerRaw.includes("@")) {
      const parts = lowerRaw.split("@");
      let localPart = parts[0]
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/\.{2,}/g, ".");
      let domainPart = parts
        .slice(1)
        .join("@")
        .replace(/[^a-z0-9_.-]/g, "")
        .replace(/\.{2,}/g, ".");
      sanitizedValue = localPart + "@" + domainPart;
    } else {
      sanitizedValue = lowerRaw
        .replace(/[^a-z0-9._-]/g, "")
        .replace(/\.{2,}/g, ".");
    }

    setEmail(sanitizedValue);

    if (lowerRaw !== sanitizedValue)
      setEmailError("Se eliminaron caracteres no permitidos.");
    else if (containsSQLCommand(sanitizedValue))
      setEmailError("Formato inválido o contiene comandos no permitidos.");
    else setEmailError(null);
  };

  const handleEmailBlur = () => {
    const trimmedRight = email.replace(/\s+$/, "");
    if (trimmedRight !== email) {
      setEmail(trimmedRight);
      if (!isValidEmail(trimmedRight) || containsSQLCommand(trimmedRight)) {
        setEmailError("Formato inválido o contiene comandos no permitidos.");
      } else {
        setEmailError(null);
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  /** Flujo:
   * 1) Consultar estatus por email
   * 2) Si estatus === "Reingreso" → abrir cambio de clave (NO validar clave)
   * 3) Si estatus !== "Activado" → diálogo informativo (NO validar clave)
   * 4) Si estatus === "Activado" → ejecutar login normal
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = email;
    if (!isValidEmail(sanitizedEmail) || containsSQLCommand(sanitizedEmail)) {
      setEmailError("Formato inválido o contiene comandos no permitidos.");
      return;
    }

    setSubmitting(true);

    const status = await fetchUserStatus(sanitizedEmail);
    if (typeof status === "string") {
      const normalized = status.trim().toLowerCase();

      if (normalized === "reingreso") {
        setSubmitting(false);
        openChangePasswordDialog();
        return;
      }

      if (normalized !== "activado") {
        const msg =
          STATUS_MESSAGES[normalized] ||
          "Su usuario no está habilitado para iniciar sesión en este momento.";
        setStatusKey(normalized);
        setStatusMessage(msg);
        setStatusDialogOpen(true);
        setSubmitting(false);
        return;
      }
    }

    // Si está activado (o si el endpoint no respondió), intentar login normal
    await dispatch(loginAsync({ username: sanitizedEmail, password }));
    setSubmitting(false);
  };

  // ====== Cambio de Clave (Reingreso) ======
  const resetChangePassState = () => {
    setNewPass("");
    setConfirmPass("");
    setChangePassError(null);
    setChangePassSaving(false);
    setChangePassSuccess(false);
  };

  const openChangePasswordDialog = () => {
    resetChangePassState();
    setChangePassOpen(true);
  };

  const closeChangePasswordDialog = () => {
    setChangePassOpen(false);
    resetChangePassState();
    dispatch(clearAuthError());
  };

  const validatePasswords = (): string | null => {
    if (!newPass || !confirmPass) return "Debe completar ambos campos.";
    if (newPass.length < 8) return "La clave debe tener al menos 8 caracteres.";
    if (newPass !== confirmPass) return "Las claves no coinciden.";
    return null;
  };

  const handleSaveNewPassword = async () => {
    const validation = validatePasswords();
    if (validation) {
      setChangePassError(validation);
      return;
    }
    setChangePassError(null);
    setChangePassSaving(true);

    try {
      const res = await fetch(CHANGE_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, newPassword: newPass }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const backendMsg: string | undefined =
          (data?.error as string) || (data?.message as string);
        const friendly = translateBackendError(backendMsg || "", {
          httpStatus: res.status,
        });
        setChangePassError(friendly);
        setChangePassSaving(false);
        return;
      }

      // Éxito
      setChangePassSuccess(true);
      setChangePassSaving(false);
    } catch (err) {
      const friendly = translateBackendError(err);
      setChangePassError(friendly);
      setChangePassSaving(false);
    }
  };

  // Ícono del diálogo general: rojo para críticos; blanco para el resto (sobre fondo azul)
  const isCritical = statusKey === "desactivado" || statusKey === "bloqueado";
  const DialogIcon = isCritical ? WarningAmberIcon : InfoIcon;
  const iconColor = isCritical ? "#EE2A24" : "#FFFFFF";

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setPassword(""); // volver al formulario limpiando clave
    dispatch(clearAuthError()); // limpia lastErrorCode/lastEstatus en Redux
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    dispatch(clearAuthError());
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 1300,
      }}
    >
      <Paper
        sx={{
          width: { xs: "90%", md: "50%" },
          padding: "40px",
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          boxShadow: 6,
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{ marginBottom: "30px", fontWeight: "bold", color: "#003876" }}
        >
          Iniciar sesión
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Correo electrónico"
                variant="outlined"
                fullWidth
                type="email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                onBlur={handleEmailBlur}
                error={!!emailError}
                helperText={emailError}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  "& .MuiFormLabel-root": { color: "#808080" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "#003876" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Contraseña"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                  "& .MuiFormLabel-root": { color: "#808080" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#003876" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                sx={{
                  padding: "8px",
                  backgroundColor: "#003876",
                  "&:hover": {
                    backgroundColor: "#EE2A24",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                  },
                  fontWeight: "bold",
                }}
              >
                {submitting ? <CircularProgress size={22} /> : "Iniciar sesión"}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button
                href="http://localhost:5173/solicitar-acceso"
                variant="contained"
                fullWidth
                sx={{
                  padding: "8px",
                  backgroundColor: "#00AADC",
                  "&:hover": {
                    backgroundColor: "#EE2A24",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                  },
                  fontWeight: "bold",
                }}
              >
                SOLICITAR ACCESO
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Diálogo por Estatus (general) */}
      <Dialog
        open={statusDialogOpen}
        onClose={handleCloseStatusDialog}
        aria-labelledby="estatus-dialog-title"
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#FFFFFF",
            borderRadius: "10px",
          },
        }}
      >
        {/* Título se mantiene en este diálogo de estatus */}
        <DialogContent
          sx={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            textAlign: "center",
            pt: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            Aviso de acceso
          </Typography>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            <DialogIcon sx={{ color: iconColor }} />
            {statusMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button
            onClick={handleCloseStatusDialog}
            variant="contained"
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Error Global (azul, SIN título) */}
      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#FFFFFF",
            borderRadius: "10px",
            width: { xs: "90%", sm: 520 },
          },
        }}
      >
        <DialogContent
          sx={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            textAlign: "center",
            py: 3,
          }}
        >
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {errorDialogMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          <Button
            onClick={handleCloseErrorDialog}
            variant="contained"
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#003876",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: Cambio de Clave (Reingreso) */}
      <Dialog
        open={changePassOpen}
        onClose={closeChangePasswordDialog}
        aria-labelledby="reingreso-dialog-title"
        PaperProps={{
          sx: {
            backgroundColor: "#003876",
            color: "#FFFFFF",
            borderRadius: "10px",
            width: { xs: "90%", sm: 520 },
          },
        }}
      >
        <DialogContent
          sx={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            textAlign: "center",
            pt: 3,
          }}
        >
          <Typography
            sx={{ fontWeight: "bold", textTransform: "uppercase", mb: 1.5 }}
          >
            Cambiar clave
          </Typography>

          {changePassSuccess ? (
            <Typography sx={{ mb: 2 }}>
              Su clave fue actualizada correctamente. Ya puede iniciar sesión.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Usuario"
                  value={email}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#FFFFFF" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      color: "#FFFFFF",
                    },
                    "& .MuiInputLabel-root": { color: "#FFFFFF" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#FFFFFF",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Nueva clave"
                  type="password"
                  value={newPass}
                  fullWidth
                  onChange={(e) => setNewPass(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#FFFFFF" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      color: "#FFFFFF",
                    },
                    "& .MuiInputLabel-root": { color: "#FFFFFF" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#FFFFFF",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Confirmar clave"
                  type="password"
                  value={confirmPass}
                  fullWidth
                  onChange={(e) => setConfirmPass(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#FFFFFF" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      color: "#FFFFFF",
                    },
                    "& .MuiInputLabel-root": { color: "#FFFFFF" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#FFFFFF",
                    },
                  }}
                />
              </Grid>

              {changePassError && (
                <Grid item xs={12}>
                  <Typography
                    sx={{
                      bgcolor: "#FFFFFF",
                      color: "#003876",
                      p: 1.2,
                      borderRadius: "8px",
                      fontWeight: 500,
                      textAlign: "center",
                    }}
                  >
                    {changePassError}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "center" }}>
          {changePassSuccess ? (
            <Button
              onClick={closeChangePasswordDialog}
              variant="contained"
              sx={{
                backgroundColor: "#FFFFFF",
                color: "#003876",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
              }}
            >
              Ir a iniciar sesión
            </Button>
          ) : (
            <>
              <Button
                onClick={closeChangePasswordDialog}
                variant="contained"
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#003876",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
                }}
                disabled={changePassSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNewPassword}
                variant="contained"
                sx={{
                  backgroundColor: "#FFFFFF",
                  color: "#003876",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "#EE2A24", color: "#FFFFFF" },
                }}
                disabled={changePassSaving}
              >
                {changePassSaving ? (
                  <CircularProgress size={22} />
                ) : (
                  "Guardar clave"
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AutenticaDO;
