/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Container,
  MenuItem,
} from "@mui/material";
import {
  Person,
  Mail,
  Phone,
  Badge,
  Work,
  Description,
  Apartment,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const CrearUsuarios: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    CorreoElectronico: "",
    Nombres: "",
    Apellidos: "",
    Cedula: "",
    OrganismoID: "",
    CargoRango: "",
    DescripcionCargoRango: "",
    Telefono: "",
  });

  const organismos = [
    { id: 1, nombre: "Organismo A" },
    { id: 2, nombre: "Organismo B" },
    { id: 3, nombre: "Organismo C" },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = () => {
    const {
      CorreoElectronico,
      Nombres,
      Apellidos,
      Cedula,
      OrganismoID,
      CargoRango,
      DescripcionCargoRango,
      Telefono,
    } = formData;

    if (
      !CorreoElectronico ||
      !Nombres ||
      !Apellidos ||
      !Cedula ||
      !OrganismoID ||
      !CargoRango ||
      !DescripcionCargoRango ||
      !Telefono
    ) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (!validateEmail(CorreoElectronico)) {
      alert("Por favor, ingrese un correo electrónico válido.");
      return;
    }

    console.log("Datos enviados:", formData);

    setFormData({
      CorreoElectronico: "",
      Nombres: "",
      Apellidos: "",
      Cedula: "",
      OrganismoID: "",
      CargoRango: "",
      DescripcionCargoRango: "",
      Telefono: "",
    });

    navigate("/");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          borderRadius: 2,
          boxShadow: 3,
          p: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            backgroundColor: "#003876",
            color: "#FFFFFF",
            textAlign: "center",
            py: 2,
            mb: 3,
            borderRadius: 2,
          }}
        >
          Solicitar Acceso
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#808080",
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          Complete el siguiente formulario para solicitar acceso al sistema.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              variant="outlined"
              value={formData.CorreoElectronico}
              onChange={(e) =>
                handleChange("CorreoElectronico", e.target.value)
              }
              InputProps={{ startAdornment: <Mail /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombres"
              variant="outlined"
              value={formData.Nombres}
              onChange={(e) => handleChange("Nombres", e.target.value)}
              InputProps={{ startAdornment: <Person /> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellidos"
              variant="outlined"
              value={formData.Apellidos}
              onChange={(e) => handleChange("Apellidos", e.target.value)}
              InputProps={{ startAdornment: <Person /> }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cédula"
              variant="outlined"
              value={formData.Cedula}
              onChange={(e) => handleChange("Cedula", e.target.value)}
              InputProps={{ startAdornment: <Badge /> }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Organismo"
              variant="outlined"
              value={formData.OrganismoID}
              onChange={(e) => handleChange("OrganismoID", e.target.value)}
            >
              {organismos.map((organismo) => (
                <MenuItem key={organismo.id} value={organismo.id}>
                  {organismo.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Cargo o Rango"
              variant="outlined"
              value={formData.CargoRango}
              onChange={(e) => handleChange("CargoRango", e.target.value)}
              InputProps={{ startAdornment: <Work /> }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción del Cargo o Rango"
              variant="outlined"
              value={formData.DescripcionCargoRango}
              onChange={(e) =>
                handleChange("DescripcionCargoRango", e.target.value)
              }
              InputProps={{ startAdornment: <Description /> }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Teléfono"
              variant="outlined"
              value={formData.Telefono}
              onChange={(e) => handleChange("Telefono", e.target.value)}
              InputProps={{ startAdornment: <Phone /> }}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            onClick={() => navigate(-1)}
            variant="contained"
            sx={{
              backgroundColor: "#808080",
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#000000" },
              mr: 2,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "#91BE1E",
              color: "#FFFFFF",
              "&:hover": { backgroundColor: "#739619" },
            }}
          >
            Solicitar Acceso
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default CrearUsuarios;
