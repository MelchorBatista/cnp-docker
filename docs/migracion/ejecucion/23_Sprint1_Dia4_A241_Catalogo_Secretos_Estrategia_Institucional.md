# Paso 23 - Sprint 1 - Dia 4 - Catalogo de secretos y estrategia institucional (`A.2.4.1`)

Fecha: 2026-03-05  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Catalogar los secretos y variables sensibles del portal para definir una estrategia institucional de manejo en Docker, sin exponer valores.

## 2) Metodo de levantamiento

Se ejecutaron inspecciones de codigo y archivos de entorno para identificar:

- claves de entorno en `backend/.env.local`, `backend/.env.production`, `frontend/.env`, `frontend/.env.production`
- referencias de `process.env.*` en codigo fuente (`backend` y `frontend`)
- hallazgos criticos de exposicion de secretos

Evidencia tecnica generada:

- `docs/migracion/ejecucion/23A_Catalogo_Secretos_20260305_085913.log`

## 3) Catalogo de secretos y variables sensibles (sin valores)

| ID | Variable / artefacto | Servicio | Uso tecnico | Ubicacion detectada | Entorno | Clasificacion | Metodo institucional objetivo | Rotacion | Responsable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-01 | `DB_USER` | Backend | Usuario de autenticacion SQL Server | `backend/.env.local`, `backend/.env.production`, `backend/db.ts`, `backend/config/*.ts` | DEV/STAGING/PROD | Credencial sensible | Vault institucional + inyeccion en runtime (no Git) | 90 dias | DBA + DevOps |
| S-02 | `DB_PASSWORD` | Backend | Clave de autenticacion SQL Server | `backend/.env.local`, `backend/.env.production`, `backend/db.ts`, `backend/config/*.ts` | DEV/STAGING/PROD | Secreto critico | Vault institucional + `Docker secrets`/secret mount | 60 dias | DBA + DevOps + Seguridad |
| S-03 | `SMTP_USER` | Backend | Usuario de autenticacion SMTP | `backend/.env.local`, `backend/.env.production`, `backend/controllers/userController.ts`, `backend/testMail.ts` | DEV/STAGING/PROD | Credencial sensible | Vault institucional + inyeccion en runtime | 90 dias | Infra + Seguridad |
| S-04 | `SMTP_PASS` | Backend | Clave de autenticacion SMTP | `backend/.env.local`, `backend/.env.production`, `backend/controllers/userController.ts`, `backend/testMail.ts` | DEV/STAGING/PROD | Secreto critico | Vault institucional + `Docker secrets`/secret mount | 60 dias | Infra + Seguridad |
| S-05 | `JWT_SECRET` | Backend | Firma y validacion de JWT | `backend/.env.local`, `backend/.env.production`, `backend/controllers/authController.ts`, `backend/middleware/auth.ts` | DEV/STAGING/PROD | Secreto critico | Vault institucional, acceso solo backend, no exposicion en cliente | 30-90 dias | Backend + Seguridad |
| S-06 | `JWT_PRIVATE_KEY_PATH` (+ llave privada) | Backend | Referencia a clave privada para firma | `backend/.env.local`, `backend/.env.production` | STAGING/PROD | Secreto critico (artefacto) | Llave privada fuera de repo, montada readonly desde secreto institucional | 180 dias | Seguridad + DevOps |
| S-07 | `JWT_KID` | Backend | Identificador de version de clave JWT | `backend/.env.local`, `backend/.env.production` | DEV/STAGING/PROD | Metadato sensible | Gestionado por versionado de llaves en vault | Con cada rotacion | Seguridad + Backend |
| S-08 | `VITE_SECRET_KEY` | Frontend | Clave usada en logica criptografica del cliente | `frontend/.env`, `frontend/src/utils/cryptoUtils.ts` | DEV/STAGING/PROD | Secreto critico expuesto | Eliminar del frontend; mover operacion sensible al backend | Inmediata | Frontend + Backend + Seguridad |
| S-09 | Llaves TLS locales (`*.key`) | Proxy/Infra | Material criptografico TLS | `nginx/certs/localhost.key`, `c1491.key` (workspace local) | DEV/STAGING/PROD | Secreto critico (certificado) | Custodia en sistema institucional de certificados; nunca en repositorio | Segun politica PKI | Infra + Seguridad |

## 4) Hallazgos principales del catalogo

1. Se detecta `VITE_SECRET_KEY` en frontend, lo que implica exposicion del secreto en bundle cliente.
2. Existen secretos criticos definidos en archivos `.env` de backend para entorno productivo.
3. Se referencia `JWT_PRIVATE_KEY_PATH`, pero la llave privada no esta presente en `backend/secrets/es256-priv.pem` en este workspace; debe proveerse por mecanismo institucional.

## 5) Estrategia institucional definida para la migracion Docker

### 5.1 Principios obligatorios

- Ningun secreto productivo se versiona en Git.
- Ningun secreto via `VITE_*` en frontend.
- Secretos inyectados en runtime (no baked en imagen Docker).
- Trazabilidad obligatoria por secreto: propietario, fecha de alta, ultima y proxima rotacion.

### 5.2 Estrategia por entorno

1. DEV:
   - Se permiten `.env.local` solo con credenciales de desarrollo/no productivas.
   - Valores reales institucionales no deben estar en laptops.
2. STAGING:
   - Secretos cargados desde vault institucional o mecanismo equivalente de la plataforma.
   - Backend consume secretos por variables seguras o archivos montados readonly.
3. PRODUCCION:
   - Igual que STAGING, con controles de aprobacion y rotacion reforzados.
   - Prohibido despliegue si existe secreto productivo fuera del mecanismo institucional.

### 5.3 Acceso y control

- Acceso minimo necesario (RBAC):
  - Backend: DB, SMTP, JWT.
  - Frontend: solo configuracion no secreta.
- Registro de auditoria:
  - lectura/rotacion/revocacion de secretos
  - incidente asociado y responsable

## 6) Acciones tecnicas derivadas (backlog inmediato)

1. Retirar `VITE_SECRET_KEY` de frontend y migrar criptografia sensible al backend.
2. Sustituir secretos productivos en `.env.production` por inyeccion desde mecanismo institucional.
3. Crear archivos `.env.example` saneados (sin valores secretos) para backend/frontend.
4. Definir plantilla de `docker-compose`/despliegue para consumo de secretos en runtime.
5. Vincular politicas de rotacion a runbook de operaciones.

## 7) Resultado del punto `A.2.4.1`

- [x] Catalogo de secretos y variables sensibles levantado sin exponer valores.
- [x] Estrategia institucional de manejo de secretos definida por entorno.
- [x] Responsables y periodicidad de rotacion propuestos.
- [x] Evidencia tecnica generada en log.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.2.4.1` en el plan.

