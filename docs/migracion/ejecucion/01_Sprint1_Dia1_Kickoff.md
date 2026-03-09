# Paso 1 - Sprint 1 / Dia 1 - Kickoff tecnico

Fecha: 2026-02-24  
Estado: Ejecutado - actualizado con responsables operativos y pendiente de `Confirmado` del usuario

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

> Nota: la matriz queda asignada con responsables operativos iniciales; puede refinarse luego con nombres institucionales adicionales sin invalidar el kickoff.

| Area | Rol | Responsable | Backup | Estado |
|---|---|---|---|---|
| Proyecto | Lider tecnico | DIONICIO MELCHOR BATISTA JEREZ | SIN BACKUP DEFINIDO | En progreso |
| Backend/API | Responsable backend | DIONICIO MELCHOR BATISTA JEREZ | SIN BACKUP DEFINIDO | En progreso |
| Frontend | Responsable frontend | DIONICIO MELCHOR BATISTA JEREZ | SIN BACKUP DEFINIDO | En progreso |
| Infraestructura | DevOps/Plataforma | DEPARTAMENTO DE INFRAESTRUCTURA | SIN BACKUP DEFINIDO | En progreso |
| Seguridad | Seguridad TI | SEGURIDAD TI | SIN BACKUP DEFINIDO | En progreso |
| Redes | Ingenieria de redes | INGENIERIA DE REDES | SIN BACKUP DEFINIDO | En progreso |
| Base de datos | DBA SQL Server | DBA SQL SERVER | SIN BACKUP DEFINIDO | En progreso |
| Operaciones | Operaciones TI | OPERACIONES TI | SIN BACKUP DEFINIDO | En progreso |

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
- [x] Se dejo matriz de responsables operativa.
- [x] Se definio flujo de aprobacion.
- [x] Se genero evidencia documental del paso.
- [ ] Pendiente confirmacion del usuario para marcar el paso con `//`.
