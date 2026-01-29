# Evidencia NORTIC A6 — Portal CNP

## Resumen

Este documento reúne evidencias del repositorio que respaldan el cumplimiento de los requisitos de la NORTIC A6: Sencillez, Indexabilidad, Compatibilidad, Actualización y Rapidez. Incluye referencias a archivos y extractos listos para adjuntar en la certificación.

---

## 1) Sencillez ✅

- Diseño modular: código organizado en `controllers/`, `services/`, `routes/`, `utils/` y `helpers/`.
  - Ejemplos: `backend/controllers/nominaResumidaController.ts`, `backend/services/recibirNominaService.ts`.
- Tipado y verificación estática:
  - `backend/tsconfig.json` con `"strict": true` y script `npm run typecheck` en `backend/package.json`.
- Auditoría operativa: `backend/middleware/audit.ts` registra acciones de usuario en la tabla `RNP_Auditoria` mediante la función `registrarAuditoria` (extracto incluido en `EXTRACTS.md`). ✅

---

## 2) Indexabilidad ✅

- Consultas paramétricas y filtros por columnas (favorecen uso de índices):

Extracto de `backend/controllers/nominaResumidaController.ts`:

```sql
SELECT
  CAST(CodigoOrganismo AS VARCHAR(10)) AS CodigoOrganismoMAP,
  NombreOrganismo AS Organismo,
  PoderDelEstado,
  Anio,
  Mes,
  Empleados
FROM DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida
WHERE Anio = @Anio AND Mes = @Mes [AND CodigoOrganismo/Poder]
ORDER BY NombreOrganismo;
```

- Recomendación práctica (ver `DB_INDEX_RECOMMENDATIONS.md`): indexar `Anio`, `Mes`, `PoderDelEstado`, `CodigoOrganismo`.

---

## 3) Compatibilidad ✅

- Requisito de plataforma: `backend/package.json` contiene:

```json
"engines": { "node": ">=18.17.0" }
```

- Compilación y target: `backend/tsconfig.json` con `"target": "ES2020"` y `moduleResolution: "node"`.

---

## 4) Actualización ⚠️ (parcial)

- Buena base para mantenimiento: scripts `test`, `typecheck`, `build` en `backend/package.json` permiten detectar fallos antes del despliegue.
- Brecha detectada: no aparece configuración de Dependabot ni workflows en `.github/workflows` que automaticen actualizaciones de dependencias y auditorías de seguridad. Ver `SUGGESTED_CI_AND_DEPENDABOT.md` para plantilla y pasos sugeridos.

---

## 5) Rapidez ✅

- Pool de conexiones con límites y timeouts (gestión eficiente de recursos):

Extracto de `backend/utils/dbPool.ts`:

```js
pool: { max: 20, min: 0, idleTimeoutMillis: 30000 }
```

- Cache warm-up al iniciar servidor (reduce latencia en primera carga):

Extracto de `backend/server.ts`:

```ts
const data = await getValidationData();
setCachedValidationData(data);
console.log("✅ Datos de validación cargados en caché inicialmente.");
```

- Rate limiting para endpoints sensibles (`/test-connections`) con `express-rate-limit`.

---

## Archivos adicionales incluidos en `docs/evidence/`

- `EXTRACTS.md` — extractos listos para adjuntar.
- `DB_INDEX_RECOMMENDATIONS.md` — recomendaciones y SQL sugerido para índices.
- `SUGGESTED_CI_AND_DEPENDABOT.md` — nota con plantilla de `dependabot.yml` y `ci.yml` de GitHub Actions (recomendación para mejorar actualización automática).

---

Si quieres, puedo generar un PR que añada la configuración de Dependabot y un workflow de CI de ejemplo. Indica si deseas que lo haga.
