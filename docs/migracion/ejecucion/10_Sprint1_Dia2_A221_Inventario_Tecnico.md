# Paso 10 - Sprint 1 - Dia 2 - Inventario tecnico (`A.2.2.1`)

Fecha: 2026-03-04  
Estado: Ejecutado - Confirmado por el usuario (2026-03-04)

## 1) Objetivo del paso

Levantar inventario tecnico de:

- Runtimes
- Librerias principales
- Puertos y rutas tecnicas
- Configuraciones por entorno

## 2) Inventario de runtimes y stack detectado

### Backend

- Plataforma: Node.js + TypeScript
- Framework HTTP: Express
- Tiempo real: Socket.IO
- Base de datos: SQL Server institucional via `mssql`

### Frontend

- Plataforma: React + Vite + TypeScript
- Cliente de tiempo real: `socket.io-client`

### Proxy / Edge

- Nginx con configuracion activa en `nginx/conf/nginx.conf`

### Entorno local (comandos ejecutados)

- `node --version` -> `v24.14.0`
- `npm.cmd --version` -> `11.9.0`
- `docker --version` -> no disponible en PATH
- `wsl --status` -> WSL no instalado en el entorno actual

## 3) Inventario de librerias principales

### Backend (`backend/package.json`)

- Dependencias principales:
  - `express` `^4.21.2`
  - `socket.io` `^4.8.1`
  - `mssql` `^11.0.1`
  - `jsonwebtoken` `^9.0.2`
  - `nodemailer` `^6.10.0`
  - `multer` `^2.0.2`
  - `winston` `^3.17.0`
- Tooling:
  - TypeScript, Jest, ESLint, Prettier, ts-node

### Frontend (`frontend/package.json`)

- Dependencias principales:
  - `react` `^18.3.1`
  - `react-dom` `^18.3.1`
  - `react-router-dom` `^7.1.3`
  - `@reduxjs/toolkit` `^2.6.1`
  - `socket.io-client` `^4.8.1`
  - `axios` `^1.7.9`
- Tooling:
  - Vite `^6.3.6`
  - TypeScript
  - ESLint + Prettier

## 4) Inventario de puertos y rutas

### Backend (`backend/server.ts`)

- Puerto API: `PORT || SERVER_PORT || 3000`
- Rutas base configurables:
  - `BASE_PATH` (default `/`)
  - `API_PREFIX` (default `/api`)
  - `SOCKETIO_PATH` (default `/socket.io`)
- Healthcheck: `/health`

### Frontend (`frontend/vite.config.ts`)

- Basepath configurable: `VITE_BASEPATH`
- Proxy DEV a backend:
  - `VITE_BACKEND_URL` o fallback por puerto
  - Puerto fallback: `VITE_DEV_BACKEND_PORT || PORT || 28444`

### Nginx (`nginx/conf/nginx.conf`)

- `listen 80`
- `listen 8443 ssl`
- Publicacion frontend en `location /cnp/`
- Rutas absolutas Windows detectadas para certificados y `root` (no portables a contenedor)

### SQL Server

- Conectores usan `DB_SERVER` + `DB_PORT`
- Puerto default detectado: `1433`

## 5) Inventario de configuraciones por entorno

Archivos detectados:

- `backend/.env.local`
- `backend/.env.production`
- `frontend/.env`
- `frontend/.env.production`

Variables clave detectadas (solo nombres):

- Backend:
  - `PORT`, `SERVER_PORT`, `BASE_PATH`, `API_PREFIX`, `SOCKETIO_PATH`
  - `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `JWT_SECRET`, `JWT_PRIVATE_KEY_PATH`, `JWT_KID`
- Frontend:
  - `VITE_BASEPATH`, `VITE_API_BASE_URL`, `VITE_BACKEND_URL`
  - `VITE_LOGIN_ENDPOINT`, `VITE_VALIDATION_ENDPOINT`
  - `VITE_CHANGE_PASSWORD_ENDPOINT`, `VITE_STATUS_ENDPOINT`

## 6) Hallazgos relevantes para migracion Docker

1. No se detectaron `Dockerfile` ni `docker-compose*.yml/yaml` en el repositorio.
2. Nginx mantiene rutas absolutas Windows (`C:/Desarrollo/cnp/...`) que requieren refactor para contenedor.
3. Existen archivos `.env` con variables sensibles en el repositorio local; debe mantenerse estrategia de secretos fuera de git para STAGING/PROD.
4. En el entorno de ejecucion actual no se detecta Docker ni WSL instalados.

## 7) Evidencia tecnica de comandos (resumen)

Comandos usados:

```powershell
node --version
npm.cmd --version
docker --version
wsl --status
```

Resultados:

- Node: `v24.14.0`
- npm: `11.9.0`
- Docker: no reconocido
- WSL: no instalado

## 8) Estado del punto

- `A.2.2.1` ejecutado con inventario documentado.
- Confirmacion del usuario recibida; punto marcado con `//` en el plan.
