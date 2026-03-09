# Paso 27 - Sprint 1 - Dia 5 - Validacion y remediacion de prerequisitos externos para STAGING (`A.2.5.3`)

Fecha: 2026-03-05  
Estado: Ejecutado - Remediacion parcial aplicada - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Validar y resolver, en lo posible desde el repositorio y entorno actual, los prerequisitos externos para STAGING:

- TLS
- DNS/firewall
- credenciales CI/CD
- acceso a registry privado
- ventana de cambio autorizada

## 2) Automatizaciones implementadas

### 2.1 Verificador principal (mejorado)

- `scripts/migracion/verificar_prerequisitos_externos_staging.ps1`

Mejoras aplicadas:

1. Matriz correcta de conectividad por host:
   - host web STAGING (`c1491`) para HTTPS
   - host SQL STAGING (`DB_SERVER` de `backend/.env.production`) para puerto `1433`
2. Separacion de puertos requeridos vs opcionales.
3. Inspeccion nativa de metadatos del certificado (`.crt`).
4. Generacion automatica de plantilla de acta de ventana de cambio cuando no existe.
5. Validacion estricta de bloqueo: cualquier `PARCIAL`, `FALLA` o `PENDIENTE_EXTERNO` en prerequisitos obligatorios mantiene estado `BLOQUEADO`.

### 2.2 Verificador de secretos CI/registry

- `scripts/migracion/verificar_secretos_ci_registry_staging.ps1`

Valida presencia de secretos esperados y, si estan disponibles, prueba login/logout contra registry.

### 2.3 Workflow dedicado para prerequisitos STAGING

- `.github/workflows/staging-prerequisitos.yml`

Incluye validacion de secretos/registry por `workflow_dispatch` y publicacion de evidencia en artifact.

### 2.4 Acta base de ventana de cambio

- `docs/migracion/operaciones/Acta_Ventana_Cambio_STAGING.md`

Generada como plantilla para completar aprobacion institucional.

## 3) Ejecuciones y evidencia

Comandos ejecutados:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_prerequisitos_externos_staging.ps1 -AplicarCorreccionesLocales
powershell -ExecutionPolicy Bypass -File .\scripts\migracion\verificar_secretos_ci_registry_staging.ps1
```

Logs de evidencia:

- `docs/migracion/ejecucion/27A_Verificacion_Prerequisitos_Externos_STAGING_20260305_102107.log`
- `docs/migracion/ejecucion/27B_Verificacion_Secretos_CI_Registry_STAGING_20260305_101807.log`

## 4) Checklist consolidado (post-remediacion)

| Prerequisito | Estado | Evidencia resumida | Responsable de cierre |
| --- | --- | --- | --- |
| TLS (certificado + llave staging) | PARCIAL | `c1491.crt` y `c1491.key` detectados; falta validacion institucional final de uso | Infra + Seguridad |
| TLS (metadatos del certificado) | OK | `CN=c1491.map.local`, vigencia hasta `2026-09-11` | Infra + Seguridad |
| DNS host web STAGING | OK | `c1491 -> 192.168.30.67` | Redes |
| DNS host SQL STAGING | OK | `d1491n2023 -> 192.168.30.162` | Redes + DBA |
| Firewall/red web (puertos requeridos) | OK | `c1491:443=OK` | Redes + Infra |
| Firewall/red web (puertos opcionales) | OBSERVACION | `c1491:8443=FALLA` (no bloqueante por ser opcional) | Infra |
| Firewall/red SQL (`1433`) | OK | `d1491n2023:1433=OK` | Redes + DBA |
| Credenciales CI/CD despliegue | PARCIAL | Referencias de secretos ya incluidas en workflow dedicado; faltan valores reales en entorno CI | DevOps + Seguridad |
| Acceso a registry privado | PENDIENTE_EXTERNO | Host/credenciales de registry no disponibles en este entorno | DevOps |
| Ventana de cambio autorizada | PARCIAL | Acta plantilla creada, pendiente estado `APROBADA` con fecha/firmas | Operaciones + Gestion de cambio |

## 5) Inconvenientes resueltos dentro del programa

1. Se elimino falso negativo de conectividad SQL (ahora se valida contra host SQL real, no contra host web).
2. Se formalizo el mecanismo tecnico para validar secretos/registry en CI (workflow dedicado + script).
3. Se creo el artefacto base para cierre de ventana de cambio (acta operativa).

## 6) Bloqueadores externos vigentes

1. Cargar secretos reales en CI (`STAGING_*`) y ejecutar workflow `STAGING Prerequisitos`.
2. Definir host de registry privado y validar login operativo con credenciales institucionales.
3. Completar acta de ventana de cambio con `Estado: APROBADA`, fecha de ventana y aprobadores.
4. Validar institucionalmente el certificado/llave staging para uso productivo en edge.

## 7) Criterio de cierre del punto `A.2.5.3`

- [x] Validacion automatizada ejecutada.
- [x] Remediaciones tecnicas locales implementadas.
- [x] Evidencia documentada con logs y artefactos.
- [ ] Bloqueadores externos cerrados en estado `OK`.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.2.5.3`.
