/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/components/EstadisticasEjemplo.ts
/* ---------------- Tipos ---------------- */
export type InstitutionType =
  | "Poder Ejecutivo"
  | "Poder Legislativo"
  | "Poder Judicial"
  | "Gobiernos Locales"
  | "Organismos Autónomos";

export interface Institution {
  id: number;
  name: string;
  type: InstitutionType;
  percentage: number;
  attempts: number;
  failed: number;
  successful: number;
  employeeCount: number;
}

/* ---------------- Datos fijos ---------------- */
export const ALL_INSTITUTIONS: Institution[] = [
  // Poder Ejecutivo
  {
    id: 1,
    name: "Ministerio de Hacienda",
    type: "Poder Ejecutivo",
    percentage: 98.5,
    attempts: 1250,
    failed: 18,
    successful: 1232,
    employeeCount: 4500,
  },
  {
    id: 2,
    name: "Ministerio de Educación",
    type: "Poder Ejecutivo",
    percentage: 95.2,
    attempts: 25000,
    failed: 1190,
    successful: 23810,
    employeeCount: 150000,
  },
  {
    id: 3,
    name: "Ministerio de Salud Pública",
    type: "Poder Ejecutivo",
    percentage: 92.8,
    attempts: 8500,
    failed: 602,
    successful: 7898,
    employeeCount: 60000,
  },
  {
    id: 6,
    name: "Ministerio de Obras Públicas",
    type: "Poder Ejecutivo",
    percentage: 90.1,
    attempts: 3200,
    failed: 315,
    successful: 2885,
    employeeCount: 15000,
  },
  {
    id: 7,
    name: "Procuraduría General",
    type: "Poder Ejecutivo",
    percentage: 96.0,
    attempts: 1800,
    failed: 72,
    successful: 1728,
    employeeCount: 8000,
  },
  {
    id: 8,
    name: "Ministerio de la Presidencia",
    type: "Poder Ejecutivo",
    percentage: 97.3,
    attempts: 950,
    failed: 25,
    successful: 925,
    employeeCount: 3500,
  },
  // Organismos Autónomos
  {
    id: 4,
    name: "DGII",
    type: "Organismos Autónomos",
    percentage: 99.1,
    attempts: 2100,
    failed: 19,
    successful: 2081,
    employeeCount: 5500,
  },
  {
    id: 5,
    name: "Banco Central RD",
    type: "Organismos Autónomos",
    percentage: 100.0,
    attempts: 1500,
    failed: 0,
    successful: 1500,
    employeeCount: 2500,
  },
  {
    id: 13,
    name: "Junta Central Electoral",
    type: "Organismos Autónomos",
    percentage: 98.8,
    attempts: 2800,
    failed: 34,
    successful: 2766,
    employeeCount: 6000,
  },
  // Poder Legislativo
  {
    id: 9,
    name: "Senado de la República",
    type: "Poder Legislativo",
    percentage: 94.5,
    attempts: 450,
    failed: 25,
    successful: 425,
    employeeCount: 1200,
  },
  {
    id: 10,
    name: "Cámara de Diputados",
    type: "Poder Legislativo",
    percentage: 93.9,
    attempts: 880,
    failed: 53,
    successful: 827,
    employeeCount: 2200,
  },
  // Poder Judicial
  {
    id: 11,
    name: "Suprema Corte de Justicia",
    type: "Poder Judicial",
    percentage: 98.2,
    attempts: 1100,
    failed: 19,
    successful: 1081,
    employeeCount: 7000,
  },
  {
    id: 14,
    name: "Tribunal Constitucional",
    type: "Poder Judicial",
    percentage: 99.5,
    attempts: 300,
    failed: 1,
    successful: 299,
    employeeCount: 800,
  },
  // Gobiernos Locales
  {
    id: 12,
    name: "Ayuntamiento 1",
    type: "Gobiernos Locales",
    percentage: 98.7,
    attempts: 4200,
    failed: 470,
    successful: 3730,
    employeeCount: 9500,
  },
  {
    id: 15,
    name: "Ayuntamiento 2",
    type: "Gobiernos Locales",
    percentage: 85.3,
    attempts: 3500,
    failed: 510,
    successful: 2990,
    employeeCount: 7800,
  },
  {
    id: 16,
    name: "Ayuntamiento 3",
    type: "Gobiernos Locales",
    percentage: 68.0,
    attempts: 1500,
    failed: 480,
    successful: 1020,
    employeeCount: 3200,
  },
];
