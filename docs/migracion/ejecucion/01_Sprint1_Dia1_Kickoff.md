# Paso 1 - Sprint 1 / Dia 1 - Kickoff tecnico

Fecha: 2026-02-24  
Estado: Ejecutado - pendiente de `Confirmado` del usuario

## 1) Alcance exacto del proyecto (confirmado para este paso)

### Incluye
- Contenerizacion de backend Node/TypeScript.
- Contenerizacion de frontend React/Vite.
- Proxy reverso para `/cnp`, `/api` y `/socket.io`.
- Gestion de secretos fuera del repositorio.
- Pipeline CI/CD para build, scan y publicacion de imagenes.
- Despliegue progresivo: DEV -> STAGING -> PRODUCCION.
- Uso obligatorio de SQL Server institucional como unico motor de base de datos.

### No incluye
- Reescritura de logica de negocio.
- Cambio de motor de base de datos.
- Rediseno funcional completo de frontend.

## 2) Matriz de responsables (RACI simplificado)

> Nota: completar nombres reales antes de cerrar Sprint 1.

| Area | Rol | Responsable | Backup | Estado |
|---|---|---|---|---|
| Proyecto | Lider tecnico | PENDIENTE | PENDIENTE | Pendiente |
| Backend/API | Responsable backend | PENDIENTE | PENDIENTE | Pendiente |
| Frontend | Responsable frontend | PENDIENTE | PENDIENTE | Pendiente |
| Infraestructura | DevOps/Plataforma | PENDIENTE | PENDIENTE | Pendiente |
| Seguridad | Seguridad TI | PENDIENTE | PENDIENTE | Pendiente |
| Redes | Ingenieria de redes | PENDIENTE | PENDIENTE | Pendiente |
| Base de datos | DBA SQL Server | PENDIENTE | PENDIENTE | Pendiente |
| Operaciones | Operaciones TI | PENDIENTE | PENDIENTE | Pendiente |

## 3) Flujo de aprobacion de cambios del plan

1. Preparacion tecnica del cambio (equipo de desarrollo).
2. Revision de infraestructura y seguridad (DevOps + Seguridad).
3. Revision de conectividad y base de datos (Redes + DBA).
4. Aprobacion final de ejecucion (Lider tecnico + Operaciones).
5. Ejecucion controlada con evidencia.
6. Cierre del paso con estado confirmado.

### Regla de control acordada
- Cada punto hijo completado se marca con prefijo //.
- Un punto padre se marca con // solo cuando todos sus hijos esten en //.
- Al cerrar un bloque completo, tambien se marcan con // objetivos, estrategias y requisitos relacionados.
- Ningun punto se marca con // sin evidencia y sin confirmacion explicita del usuario (Confirmado).

## 4) Evidencia de este paso

- Plan base actualizado: `C:\Desarrollo\cnp-docker\Migracion_Docker.js`.
- Acta tecnica de kickoff (este archivo).
- Definicion de uso obligatorio de SQL Server institucional incluida en el plan.

## 5) Checklist de cierre del paso

- [x] Se definio el alcance exacto (incluye/no incluye).
- [x] Se dejo matriz de responsables para completar.
- [x] Se definio flujo de aprobacion.
- [x] Se genero evidencia documental del paso.
- [ ] Pendiente confirmacion del usuario para marcar el paso con `//`.
