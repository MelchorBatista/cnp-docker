# Paso 3 - Sprint 1 - Matriz de secretos y registro de riesgos (A.2.4 / A.3.4.1 / A.3.4.2)

Fecha: 2026-02-24  
Estado: Ejecutado - Confirmado por el usuario (2026-02-24)

## 1) Objetivo del paso

Catalogar secretos del proyecto y establecer un registro de riesgos con controles definidos para reducir riesgo tecnico antes de iniciar la implementacion Docker.

## 2) Matriz de secretos (sin exponer valores)

| ID | Secreto / Variable | Donde se detecta | Uso | Entorno | Metodo objetivo | Rotacion | Responsable |
|---|---|---|---|---|---|---|---|
| S-01 | `DB_USER` | `backend/.env.*` | Autenticacion SQL Server institucional | DEV/STAGING/PROD | `Docker secret` o vault institucional (no en git) | 90 dias | DBA + DevOps |
| S-02 | `DB_PASSWORD` | `backend/.env.*` | Clave SQL Server institucional | DEV/STAGING/PROD | `Docker secret` o vault institucional (no en git) | 60 dias | DBA + DevOps |
| S-03 | `JWT_SECRET` | `backend/.env.*` | Firma/verificacion de token | DEV/STAGING/PROD | `Docker secret` (backend only) | 90 dias | Backend + Seguridad |
| S-04 | `SMTP_USER` | `backend/.env.*` | Credenciales SMTP | DEV/STAGING/PROD | `Docker secret` o vault institucional | 90 dias | Infra + Seguridad |
| S-05 | `SMTP_PASS` | `backend/.env.*` | Credenciales SMTP | DEV/STAGING/PROD | `Docker secret` o vault institucional | 60 dias | Infra + Seguridad |
| S-06 | `JWT_PRIVATE_KEY_PATH` + archivo clave | `backend/.env.*` | Firma JWT por llave | STAGING/PROD | Montaje read-only desde secreto/volumen seguro | 180 dias | Seguridad |
| S-07 | Certificados TLS (`*.key`, `*.pfx`) | raiz y `nginx/certs` | HTTPS de entrada | DEV/STAGING/PROD | Certificados por entorno fuera de repo | 180 dias | Redes + Seguridad |
| S-08 | `VITE_SECRET_KEY` | `frontend/.env` y uso en frontend | Cifrado lado cliente (expuesto en bundle) | DEV/STAGING/PROD | Eliminar del frontend; mover secreto al backend | Inmediata | Frontend + Seguridad |

## 3) Politica institucional de secretos para Docker

- No versionar secretos en Git (`.env`, claves privadas, certificados productivos).
- DEV: usar `.env.local` local no versionado con valores de prueba.
- STAGING/PROD: inyectar secretos via `Docker secrets` o vault institucional.
- Todo secreto con trazabilidad de propietario, fecha de creacion y proxima rotacion.
- Cualquier variable `VITE_*` se considera publica; no debe contener secretos reales.

## 4) Registro de riesgos y controles

| ID | Riesgo | Probabilidad | Impacto | Severidad | Control definido | Evidencia esperada | Responsable | Estado |
|---|---|---|---|---|---|---|---|---|
| R-01 | Backend contenedor sin conectividad al SQL Server institucional (`1433`) | Alta | Alto | Critico | Prueba de conectividad desde red Docker + regla firewall + ventana con DBA/Redes | Test DB exitoso desde contenedor | DevOps + DBA + Redes | Abierto |
| R-02 | Exposicion de secretos por archivos versionados | Media | Alto | Alto | Ignorar `.env*` y llaves sensibles; mover secretos a mecanismo institucional | PR de hardening + escaneo repo limpio | Seguridad + DevOps | Abierto |
| R-03 | `VITE_SECRET_KEY` expuesto al cliente | Alta | Alto | Critico | Retirar secreto de frontend y trasladar operacion sensible al backend | Cambio de arquitectura + pruebas funcionales | Frontend + Backend + Seguridad | Abierto |
| R-04 | Desalineacion de rutas `/api` y `/socket.io` entre Nginx/Backend/Frontend | Media | Alto | Alto | Contrato unico de rutas y pruebas smoke end-to-end | Smoke test HTTP + Socket OK | Backend + Frontend + DevOps | Abierto |
| R-05 | Desalineacion de puertos backend (3000 vs 28444) | Media | Medio | Medio | Estandarizar puerto interno de contenedor y variables por entorno | Compose + `.env.example` actualizados | Backend + DevOps | Abierto |
| R-06 | Nginx actual sin proxy a API ni Socket.IO | Alta | Alto | Critico | Plantilla Nginx Docker con reverse proxy y headers correctos | Nginx conf validada + pruebas funcionales | DevOps | Abierto |
| R-07 | Rutas absolutas Windows en Nginx no portables a contenedor | Alta | Medio | Alto | Migrar a rutas Linux de imagen y volumenes Docker | Nginx conf Dockerizada | DevOps | Abierto |
| R-08 | Sin Dockerfile/Compose inicial para baseline | Alta | Medio | Alto | Crear baseline multi-servicio con healthcheck | Build + `docker compose up` exitoso | DevOps + Backend + Frontend | Abierto |

## 5) Criterios de riesgo controlado (para cerrar A.1.1 en este componente)

Se considerara "riesgos controlados" cuando:
- Riesgos criticos (`R-01`, `R-03`, `R-06`) tengan control implementado y evidencia de prueba.
- Exista responsable asignado por riesgo con fecha objetivo.
- No queden secretos productivos versionados.

## 6) Checklist de cierre del paso

- [x] Matriz de secretos levantada sin exponer valores.
- [x] Politica de manejo de secretos definida para Docker.
- [x] Registro de riesgos con severidad, control y evidencia esperada.
- [x] Criterio formal de "riesgo controlado" definido.
- [x] Confirmado del usuario recibido; paso marcado con `//` en el plan.

## 7) Impacto sobre A.1.1

- Componente "riesgos controlados": base definida con controles y responsables por asignar nominalmente.
- Componente "arquitectura objetivo aprobada": ya confirmado en paso anterior.
- Componente "backlog priorizado": pendiente (siguiente paso).

