# Paso 24 - Sprint 1 - Dia 4 - Evidencia de matriz de secretos y registro de riesgos (`A.2.4.2`)

Fecha: 2026-03-05  
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo del paso

Emitir evidencia formal y trazable del punto `A.2.4.2`:

- matriz de secretos consolidada
- registro de riesgos asociado con severidad, mitigacion, responsable y fecha objetivo

## 2) Fuentes utilizadas

1. `docs/migracion/ejecucion/23_Sprint1_Dia4_A241_Catalogo_Secretos_Estrategia_Institucional.md`
2. `docs/migracion/ejecucion/23A_Catalogo_Secretos_20260305_085913.log`
3. `docs/migracion/ejecucion/24A_Registro_Riesgos_Secretos_20260305_090431.log`

## 3) Matriz de secretos consolidada (sin valores)

| ID | Variable / artefacto | Servicio | Entorno | Clasificacion | Metodo institucional objetivo | Rotacion | Responsable | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-01 | `DB_USER` | Backend | DEV/STAGING/PROD | Credencial sensible | Vault institucional + inyeccion runtime | 90 dias | DBA + DevOps | Abierto |
| S-02 | `DB_PASSWORD` | Backend | DEV/STAGING/PROD | Secreto critico | Vault institucional + `Docker secrets` | 60 dias | DBA + DevOps + Seguridad | Abierto |
| S-03 | `SMTP_USER` | Backend | DEV/STAGING/PROD | Credencial sensible | Vault institucional + inyeccion runtime | 90 dias | Infra + Seguridad | Abierto |
| S-04 | `SMTP_PASS` | Backend | DEV/STAGING/PROD | Secreto critico | Vault institucional + `Docker secrets` | 60 dias | Infra + Seguridad | Abierto |
| S-05 | `JWT_SECRET` | Backend | DEV/STAGING/PROD | Secreto critico | Vault institucional, acceso exclusivo backend | 30-90 dias | Backend + Seguridad | Abierto |
| S-06 | `JWT_PRIVATE_KEY_PATH` + llave privada | Backend | STAGING/PROD | Secreto critico (artefacto) | Llave privada externa al repo, montaje readonly | 180 dias | Seguridad + DevOps | Abierto |
| S-07 | `JWT_KID` | Backend | DEV/STAGING/PROD | Metadato sensible | Gestionado por versionado de llaves en vault | Con cada rotacion | Seguridad + Backend | Abierto |
| S-08 | `VITE_SECRET_KEY` | Frontend | DEV/STAGING/PROD | Secreto critico expuesto | Eliminar del frontend y migrar al backend | Inmediata | Frontend + Backend + Seguridad | Abierto |
| S-09 | `*.key` TLS local | Proxy/Infra | DEV/STAGING/PROD | Secreto critico (certificado) | Custodia institucional de certificados | Segun politica PKI | Infra + Seguridad | Abierto |

## 4) Registro de riesgos de secretos y configuracion

| ID | Riesgo | Probabilidad | Impacto | Severidad | Mitigacion definida | Responsable | Fecha objetivo | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Exposicion de secreto en frontend por `VITE_SECRET_KEY` | Alta | Alto | Critico | Retirar secreto del frontend y mover operacion sensible al backend | Frontend + Backend + Seguridad | 2026-03-06 | Abierto |
| R-02 | Secretos criticos en `.env.production` del backend | Alta | Alto | Critico | Migrar a vault institucional / secretos runtime y limpiar configuracion local | DevOps + Seguridad + Backend | 2026-03-07 | Abierto |
| R-03 | Ruta de llave privada JWT declarada sin artefacto validado en entorno objetivo | Media | Alto | Alto | Definir provisionamiento institucional de llave y prueba de lectura en contenedor | Seguridad + DevOps | 2026-03-07 | Abierto |
| R-04 | Material TLS sensible (`*.key`) en workspace local | Media | Alto | Alto | Mover custodia a gestor de certificados institucional y restringir copias locales | Infra + Seguridad | 2026-03-08 | Abierto |
| R-05 | Cobertura incompleta de reglas para ignorar `.env.*` en backend | Media | Medio | Medio | Ampliar reglas de ignore y ejecutar verificacion de archivos sensibles en PR | Backend + DevOps | 2026-03-06 | Abierto |
| R-06 | Fallback inseguro `default_secret_key` en frontend | Alta | Alto | Critico | Eliminar fallback criptografico del cliente y validar ruta backend segura | Frontend + Seguridad | 2026-03-06 | Abierto |
| R-07 | CI sin gate especifico de escaneo de secretos en commit/PR | Media | Alto | Alto | Integrar escaneo de secretos en pipeline CI con bloqueo por hallazgos criticos | DevOps + Seguridad | 2026-03-10 | Abierto |
| R-08 | Sin evidencia automatizada de rotacion y vencimiento de secretos | Media | Medio | Medio | Crear bitacora de rotacion y control de expiracion por secreto | Seguridad + Operaciones | 2026-03-12 | Abierto |

## 5) Criterios de validacion para cerrar `A.2.4.2`

1. Matriz completa de secretos sin exponer valores y con responsables definidos.
2. Registro de riesgos con severidad y fechas objetivo concretas.
3. Cada riesgo tiene mitigacion verificable y responsable directo.
4. Evidencia documental y log de trazabilidad almacenados en `docs/migracion/ejecucion`.

## 6) Resultado del punto `A.2.4.2`

- [x] Matriz de secretos consolidada publicada.
- [x] Registro de riesgos consolidado y priorizado.
- [x] Responsables y fechas objetivo definidos.
- [x] Evidencia de trazabilidad registrada.
- [ ] Pendiente `Confirmado` del usuario para comentar `A.2.4.2`.

