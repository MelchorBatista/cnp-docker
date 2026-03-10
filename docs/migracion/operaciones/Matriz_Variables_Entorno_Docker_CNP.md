# Matriz de variables de entorno Docker CNP

Fecha base: 2026-03-10
Estado: Vigente para Sprint 2 (`B.2.3.2`)

## 1) Objetivo

Consolidar el contrato vigente de variables del portal Dockerizado, diferenciando:

- variables de backend en runtime
- variables de frontend en build-time
- variables del proxy
- variables auxiliares de desarrollo, compatibilidad o reserva

La matriz no sustituye los archivos fuente. Su funcion es dejar visible, en una sola pieza, que variable existe, donde se declara, donde se consume y con que nivel de obligatoriedad.

## 2) Reglas de lectura

Estados usados en la matriz:

- `Obligatoria`: la variable participa en el contrato funcional actual.
- `Opcional`: la aplicacion la soporta, pero puede operar sin ella en el baseline aprobado.
- `Compatibilidad`: se mantiene por transicion o alias heredado.
- `Reservada`: esta declarada para una fase posterior o para un caso no implementado hoy.

Reglas importantes:

1. Las variables `VITE_*` se resuelven en build-time. No basta con definirlas en el contenedor Nginx ya construido.
2. Las variables del backend y del proxy se consumen en runtime.
3. `BASE_URL`, `DEV`, `MODE` y `PROD` son built-ins de Vite; quedan fuera del contrato declarativo del proyecto.
4. Las etiquetas `OCI_*` son metadata de imagen, no variables funcionales de configuracion.

## 3) Matriz validada

### 3.1 Backend runtime

| Grupo | Variables | Estado | Fuente validada | Consumidor validado | Observaciones |
|---|---|---|---|---|---|
| Runtime base | `NODE_ENV`, `PORT`, `SERVER_PORT`, `TRUST_PROXY` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/server.ts`, `backend/config/configuracionBases.ts` | `NODE_ENV` decide entre `.env.local` y `.env.production`. |
| Rutas publicas | `BASE_PATH`, `API_PREFIX`, `SOCKETIO_PATH` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/server.ts`, `backend/controllers/userController.ts` | Alineadas al contrato `/cnp`, `/api`, `/socket.io`. |
| Origen publico y CORS | `FRONTEND_URL`, `CORS_ORIGINS`, `CSRF_ORIGINS`, `BACKEND_URL` | `FRONTEND_URL`, `CORS_ORIGINS`, `CSRF_ORIGINS`: obligatorias. `BACKEND_URL`: opcional. | `backend/.env.example`, `docker-compose.staging.yml` | `backend/server.ts`, `backend/middleware/csrfOrigin.ts`, `backend/controllers/userController.ts` | `BACKEND_URL` solo es necesario cuando el API se publica en un origen distinto al frontend. |
| SQL VALIDACION | `DB_SERVER_VALIDACION`, `DB_PORT_VALIDACION`, `VALIDACION_DATABASE`, `DB_AUTH_VALIDACION`, `DB_USER_VALIDACION`, `DB_PASSWORD_VALIDACION` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/config/configuracionBases.ts` | Grupo exclusivo para catalogos y lectura de validacion. |
| SQL CONSULTA | `DB_SERVER_CONSULTA`, `DB_PORT_CONSULTA`, `CONSULTA_DATABASE`, `DB_AUTH_CONSULTA`, `DB_USER_CONSULTA`, `DB_PASSWORD_CONSULTA` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/config/configuracionBases.ts` | Grupo de lectura logica para reportes y vistas. |
| SQL RECEPCION | `DB_SERVER_RECEPCION`, `DB_PORT_RECEPCION`, `RECEPCION_DATABASE`, `DB_AUTH_RECEPCION`, `DB_USER_RECEPCION`, `DB_PASSWORD_RECEPCION` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/config/configuracionBases.ts`, `backend/controllers/*.ts` | Grupo principal de escritura/lectura operativa. |
| Compatibilidad SQL heredada | `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | Compatibilidad | `backend/.env.example` | `backend/config/configuracionBases.ts` | Se mantienen como fallback transitorio mientras termina la migracion. |
| TLS, pool y cache | `SQL_ENCRYPT`, `SQL_TRUST_SERVER_CERTIFICATE`, `SQL_POOL_MAX`, `SQL_POOL_MIN`, `SQL_POOL_IDLE_MILLIS`, `VALIDATION_CACHE_TTL_MS` | `VALIDATION_CACHE_TTL_MS`: opcional. Resto: obligatorias del baseline SQL. | `backend/.env.example`, `docker-compose.staging.yml` | `backend/config/configuracionBases.ts`, `backend/services/validationDataService.ts` | `VALIDATION_CACHE_TTL_MS` afina cache de catalogos. |
| Carga avanzada de entorno | `RUTA_ARCHIVO_ENTORNO` | Opcional | `backend/.env.example` | `backend/config/configuracionBases.ts` | Permite apuntar a un archivo de entorno alterno. |
| SMTP efectivo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Obligatoria cuando se usan flujos de correo | `backend/.env.example`, `docker-compose.staging.yml` | `backend/controllers/userController.ts`, `backend/testMail.ts` | Soporta confirmacion de correo y prueba manual de SMTP. |
| SMTP reservado | `SMTP_SECURE`, `SMTP_FROM` | Reservada | `backend/.env.example`, `docker-compose.staging.yml` | Sin consumidor directo actual | El backend actual fija `secure: false` y usa `SMTP_USER` como remitente efectivo. |
| JWT efectivo | `JWT_SECRET` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/controllers/authController.ts`, `backend/middleware/auth.ts` | Es la unica variable JWT con consumo funcional actual. |
| JWT reservado | `JWT_PRIVATE_KEY_PATH`, `JWT_KID` | Reservada | `backend/.env.example`, `docker-compose.staging.yml` | Sin consumidor directo actual | Quedan visibles para una futura transicion formal a ES256. |
| Rate limit | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Obligatoria | `backend/.env.example`, `docker-compose.staging.yml` | `backend/server.ts` | Aplican al endpoint de test de conexiones y al baseline de proteccion. |
| Miscelaneos reservados | `LOG_LEVEL`, `FILE_UPLOAD_MAX_MB` | Reservada | `backend/.env.example`, `docker-compose.staging.yml` | Sin consumidor directo actual | Permanecen documentadas pero no gobiernan logica activa del backend hoy. |

### 3.2 Frontend build-time y desarrollo

| Grupo | Variables | Estado | Fuente validada | Consumidor validado | Observaciones |
|---|---|---|---|---|---|
| Router SPA | `VITE_BASEPATH` | Obligatoria | `frontend/.env.example`, `frontend/Dockerfile` | `frontend/src/App.tsx`, `frontend/src/utils/socket.ts`, `frontend/vite.config.ts` | Debe permanecer alineada a `/cnp/`. |
| Base de API | `VITE_API_BASE_URL`, `VITE_BACKEND_URL`, `VITE_API_URL` | `VITE_API_BASE_URL`: obligatoria. `VITE_BACKEND_URL`: opcional. `VITE_API_URL`: compatibilidad. | `frontend/.env.example`, `frontend/Dockerfile` | `frontend/src/services/apiClient.ts`, `frontend/src/services/UserService.ts`, `frontend/src/services/ReporteNominaService.ts`, `frontend/src/services/nominaExistenteService.ts`, `frontend/src/components/Asignaciones.tsx` | `VITE_API_URL` se mantiene como alias legado mientras convergen todos los servicios al helper comun. |
| Endpoints de autenticacion | `VITE_LOGIN_ENDPOINT`, `VITE_STATUS_ENDPOINT`, `VITE_CHANGE_PASSWORD_ENDPOINT` | `VITE_LOGIN_ENDPOINT`: obligatoria. Resto: opcionales. | `frontend/.env.example`, `frontend/Dockerfile` | `frontend/src/slices/authSlice.tsx`, `frontend/src/components/AutenticaDO.tsx` | Si no se define `STATUS` o `CHANGE_PASSWORD`, el frontend construye el endpoint desde la base del API. |
| Validacion y socket | `VITE_VALIDATION_ENDPOINT`, `VITE_SOCKET_URL` | Opcional | `frontend/.env.example`, `frontend/Dockerfile` | `frontend/src/services/apiClient.ts`, `frontend/src/utils/socket.ts` | Cuando no se definen, el frontend usa base del API o mismo origen con proxy de Vite. |
| Secreto de cifrado | `VITE_SECRET_KEY` | Obligatoria para flujos de cifrado de catalogos | `frontend/.env.example`, `frontend/Dockerfile` | `frontend/src/utils/cryptoUtils.ts` | El consumidor todavia conserva el fallback historico `default_secret_key`; la matriz lo deja visible para endurecimiento posterior. |
| Variable reservada | `VITE_STATUS_PAGE_URL` | Reservada | `frontend/.env.example`, `frontend/Dockerfile` | Sin consumidor directo actual | Se mantiene declarada, pero no participa en el flujo vigente. |
| Proxy local de Vite | `CNP_DEV_BACKEND_ORIGIN` | Obligatoria para `npm run dev` | `frontend/.env.example` | `frontend/vite.config.ts` | Sin esta variable el servidor de desarrollo falla por contrato. |
| Render de `web.config` | `IIS_BACKEND_UPSTREAM`, `FRONTEND_WEB_BACKEND_UPSTREAM` | `IIS_BACKEND_UPSTREAM`: obligatoria para parametrizacion explicita. `FRONTEND_WEB_BACKEND_UPSTREAM`: compatibilidad. | `frontend/.env.example`, `frontend/scripts/render-web-config.mjs`, `frontend/public/web.config.template` | `frontend/scripts/render-web-config.mjs` | Ambas gobiernan el upstream que se inyecta en `web.config`. |

Nota operativa del frontend:

- `docker-compose.staging.yml` puede documentar valores de referencia para el frontend, pero el bundle final solo cambia si esas variables entran durante `npm run build` o durante el build de la imagen Docker.

### 3.3 Proxy y publicacion

| Grupo | Variables | Estado | Fuente validada | Consumidor validado | Observaciones |
|---|---|---|---|---|---|
| Contrato de ruteo del proxy | `PROXY_FRONTEND_UPSTREAM`, `PROXY_BACKEND_UPSTREAM`, `PROXY_BASE_PATH`, `PROXY_API_PREFIX`, `PROXY_SOCKETIO_PATH`, `PROXY_SOCKETIO_COMPAT_PATH` | Obligatoria | `proxy/Dockerfile`, `proxy/default.conf.template`, `docker-compose.staging.yml` | `proxy/default.conf.template` | Define todo el borde publico para `/cnp`, `/api`, `/socket.io` y compatibilidad `/cnp/socket.io`. |
| Publicacion de puertos | `PROXY_HTTP_PORT`, `PROXY_HTTPS_PORT` | Opcional | `docker-compose.staging.yml` | Docker Compose | Solo controla el mapeo host:contenedor; no cambia el ruteo interno de Nginx. |

## 4) Variables fuera de alcance funcional

Quedan fuera de la matriz funcional, aunque aparezcan en build o en metadata:

- `OCI_TITLE`
- `OCI_VERSION`
- `OCI_REVISION`
- `OCI_SOURCE`
- `OCI_CREATED`

Tambien quedan fuera del contrato declarativo del proyecto los built-ins de Vite:

- `BASE_URL`
- `DEV`
- `MODE`
- `PROD`

## 5) Criterio de cumplimiento

`B.2.3.2` se considera cumplido cuando:

1. existe una matriz versionada y reutilizable
2. la matriz distingue obligatorias, opcionales, compatibilidad y reservadas
3. la matriz esta validada contra declaraciones reales y consumidores reales del repositorio
4. deja visibles las notas operativas de build-time vs runtime
