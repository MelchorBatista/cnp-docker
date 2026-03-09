# Paso 35 - Sprint 1 - Validacion DoD `A.4.7` SQL Server institucional obligatorio y no reemplazable

Fecha: 2026-03-09
Estado: Ejecutado - Pendiente de confirmacion del usuario

## 1) Objetivo

Validar que el Sprint 1 deja formalmente declarado que SQL Server institucional es el motor de base de datos obligatorio del proyecto y que no debe ser reemplazado por otro motor.

## 2) Evidencia documental del plan

En `Migracion_Docker.ini` ya aparece explicitamente:

- objetivo general:
  - `Mantener SQL Server institucional como motor obligatorio y no reemplazable.`
- alcance incluido:
  - `Uso obligatorio de SQL Server institucional como único motor de base de datos.`
- supuestos:
  - `SQL Server institucional y SMTP se consumen como servicios externos.`

## 3) Evidencia documental del Sprint 1

Fuentes principales:

- `01_Sprint1_Dia1_Kickoff.md`
- `02_Sprint1_Arquitectura_Objetivo.md`
- `19_Sprint1_Dia3_A232_Topologia_Servicios_Flujos.md`
- `20_Sprint1_Dia3_A233_Documento_Stack_Tecnicas_Arquitectura.md`
- `26_Sprint1_Dia5_A252_Catalogo_Oficial_Guia_Instalacion_Completa.md`
- `docs/migracion/operaciones/Runbook_Entrega_Local_Infraestructura_STAGING.md`

Declaraciones relevantes ya registradas:

- Kickoff:
  - `Uso obligatorio de SQL Server institucional como unico motor de base de datos.`
- Arquitectura objetivo:
  - `SQL Server institucional externo obligatorio (sin reemplazo).`
- Topologia:
  - `SQL Server institucional se mantiene como servicio externo obligatorio.`
- Documento integrado:
  - `SQL Server institucional (externo y obligatorio).`
  - `SQL Server institucional no se reemplaza.`
- Catalogo oficial:
  - `Base de datos | SQL Server institucional | obligatorio y no reemplazable`
- Runbook de STAGING:
  - `dependencia externa: SQL Server institucional fuera de Docker Compose`

## 4) Evidencia primaria del codigo

### 4.1 Dependencias del backend

`backend/package.json` declara:

- `mssql`
- `msnodesqlv8`

Estas dependencias corresponden al acceso a SQL Server.

### 4.2 Configuracion de conexiones

`backend/config/configuracionBases.ts` define contratos separados para:

- `VALIDACION`
- `CONSULTA`
- `RECEPCION`

Todas las rutas de configuracion desembocan en clientes SQL Server mediante:

- `require('mssql')`
- `require('mssql/msnodesqlv8')`

### 4.3 Conectores de runtime

Los conectores:

- `backend/config/connectValidacion.ts`
- `backend/config/connectConsulta.ts`
- `backend/config/connectRecepcion.ts`

levantan `ConnectionPool` sobre la configuracion SQL institucional y registran conexiones hacia:

- servidor
- base de datos
- modo de autenticacion

## 5) Verificacion negativa de motores alternos

No se identificaron, en las dependencias declaradas del proyecto, referencias operativas a motores alternos como:

- SQLite
- PostgreSQL
- MySQL
- MariaDB

La presencia de `msnodesqlv8` no introduce un motor alterno; solo habilita el modo de autenticacion Windows para SQL Server.

## 6) Conclusion

`A.4.7 SQL Server institucional declarado como requisito obligatorio y no reemplazable` puede considerarse cumplido porque:

- el plan lo declara de forma explicita
- el Sprint 1 lo reafirma en kickoff, arquitectura, topologia, catalogo y runbook
- el codigo del backend esta estructurado sobre conectores de SQL Server
- no hay evidencia de adopcion de motores alternos en el proyecto

## 7) Estado frente al plan

- `A.4.7`: listo para marcar con `#` en `Migracion_Docker.ini` cuando el usuario confirme.
- No se modifican otros puntos DoD en este paso.
