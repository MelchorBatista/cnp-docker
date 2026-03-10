# Paso 48 - Sprint 2 - Matriz de variables validada (`B.2.3.2`)

Fecha: 2026-03-10
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Cerrar `B.2.3.2` dejando una evidencia formal y reutilizable del contrato de variables del stack Docker:

- backend runtime
- frontend build-time
- proxy
- ayudas de desarrollo
- variables de compatibilidad o reserva

## 2) Fuentes revisadas

Declaracion del contrato:

1. `backend/.env.example`
2. `frontend/.env.example`
3. `docker-compose.staging.yml`
4. `frontend/Dockerfile`
5. `proxy/Dockerfile`
6. `frontend/public/web.config.template`

Consumidores reales:

1. `backend/server.ts`
2. `backend/config/configuracionBases.ts`
3. `backend/middleware/csrfOrigin.ts`
4. `backend/controllers/userController.ts`
5. `backend/controllers/authController.ts`
6. `backend/services/validationDataService.ts`
7. `frontend/src/App.tsx`
8. `frontend/src/services/apiClient.ts`
9. `frontend/src/services/UserService.ts`
10. `frontend/src/services/ReporteNominaService.ts`
11. `frontend/src/services/nominaExistenteService.ts`
12. `frontend/src/components/AutenticaDO.tsx`
13. `frontend/src/components/Asignaciones.tsx`
14. `frontend/src/utils/socket.ts`
15. `frontend/src/utils/cryptoUtils.ts`
16. `frontend/vite.config.ts`
17. `frontend/scripts/render-web-config.mjs`
18. `proxy/default.conf.template`

Logs de trazabilidad generados para este paso:

1. `docs/migracion/ejecucion/48A_Inventario_Declaracion_Variables_B232_20260310_111812.log`
2. `docs/migracion/ejecucion/48B_Inventario_Consumo_Variables_B232_20260310_111812.log`
3. `docs/migracion/ejecucion/48C_Resumen_Matriz_Variables_B232_20260310_111812.log`

## 3) Operaciones realizadas

### 3.1 Consolidacion de la matriz operativa

Se creo el documento normativo:

- `docs/migracion/operaciones/Matriz_Variables_Entorno_Docker_CNP.md`

La matriz separa:

1. backend runtime
2. frontend build-time y ayudas de desarrollo
3. proxy y publicacion
4. variables de compatibilidad
5. variables reservadas
6. variables fuera de alcance funcional (`OCI_*`, built-ins de Vite)

### 3.2 Correccion minima del contrato declarado

Durante la validacion aparecieron consumidores sin declaracion explicita del proyecto. Para cerrar esa brecha se ajusto el contrato declarado:

- en `backend/.env.example` se agregaron `RUTA_ARCHIVO_ENTORNO` y `VALIDATION_CACHE_TTL_MS`
- en `frontend/.env.example` se agregaron `VITE_API_URL` y `FRONTEND_WEB_BACKEND_UPSTREAM`
- en `frontend/Dockerfile` se agrego `VITE_API_URL` al contrato de build

Con eso, los consumidores explicitos del proyecto quedaron cubiertos por declaracion propia, salvo los built-ins del framework.

## 4) Hallazgos validados

### 4.1 Estado general de la matriz

El resumen final de inventario quedo asi:

- declaradas unicas: `80`
- consumidas unicas: `78`
- declaradas y consumidas: `74`
- declaradas sin consumidor directo: `6`
- consumidas sin declaracion explicita: `4`

Fuente:

- `docs/migracion/ejecucion/48C_Resumen_Matriz_Variables_B232_20260310_111812.log`

### 4.2 Consumidas sin declaracion explicita

Las unicas variables consumidas sin declaracion explicita del proyecto son built-ins de Vite:

- `BASE_URL`
- `DEV`
- `MODE`
- `PROD`

No se consideran desviacion del contrato porque las provee el propio framework.

### 4.3 Declaradas sin consumidor directo

Las unicas variables declaradas sin consumidor funcional directo quedaron en:

- `VITE_STATUS_PAGE_URL`
- `OCI_TITLE`
- `OCI_VERSION`
- `OCI_REVISION`
- `OCI_SOURCE`
- `OCI_CREATED`

Interpretacion:

1. `VITE_STATUS_PAGE_URL` queda como variable reservada.
2. `OCI_*` no son variables funcionales de aplicacion; corresponden a metadata de imagen y quedan fuera del alcance funcional de la matriz.

### 4.4 Observaciones operativas relevantes

Hallazgos que la matriz deja explicitamente visibles:

1. Las `VITE_*` son build-time; definirlas en el contenedor frontend ya construido no reconfigura el bundle.
2. `DB_SERVER`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` siguen vivos solo como compatibilidad transitoria.
3. `SMTP_SECURE`, `SMTP_FROM`, `JWT_PRIVATE_KEY_PATH`, `JWT_KID`, `LOG_LEVEL` y `FILE_UPLOAD_MAX_MB` quedan documentadas, pero hoy no gobiernan logica funcional directa del codigo.
4. `VITE_SECRET_KEY` ya queda declarada y validada en la matriz, aunque el consumidor actual conserva un fallback historico que debera endurecerse mas adelante.

## 5) Resultado del paso

`B.2.3.2` puede considerarse resuelto.

El Sprint 2 deja de depender de una descripcion difusa de variables y pasa a tener:

- un documento operativo reutilizable con la matriz vigente
- evidencia de inventario y cruce declaracion-consumo
- clasificacion clara de variables obligatorias, opcionales, compatibilidad y reserva

## 6) Conclusion

Con `B.2.3.1` y `B.2.3.2` ya cerrados a nivel tecnico y documental, el bloque `B.2.3` queda listo para marcarse cuando el usuario confirme este paso.
