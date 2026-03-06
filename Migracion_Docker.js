/*
* Informacion general del plan
	- Proyecto: CNP
	- Fecha base: 2026-02-24
	- Periodo documentado de investigacion/configuracion/preparacion: 2026-02-24 al 2026-03-03
	- Fecha de inicio operativo de Sprints: 2026-03-04
	- Duracion de ejecucion operativa: 5 semanas
	- Cadencia: 5 dias habiles por Sprint
	- Modelo: 1 fase previa (completada) + 5 Sprints, 1 semana por Sprint

* Objetivo general
	- Migrar frontend, backend y proxy a Docker con despliegue controlado por entorno.
	- Asegurar seguridad minima, observabilidad, rollback y continuidad operativa.
	- Mantener SQL Server institucional como motor obligatorio y no reemplazable.

* Alcance incluido
	- Backend Node/TypeScript en contenedor.
	- Frontend React/Vite con build reproducible y entrega estatica.
	- Proxy reverso para /cnp, /api y /socket.io.
	- Gestion de secretos fuera del repositorio.
	- Pipeline CI/CD para build, scan y empaquetado local de imagenes.
	- Despliegue progresivo DEV -> STAGING -> PRODUCCION.
	- Uso obligatorio de SQL Server institucional como unico motor de base de datos.

* No alcance
	- Reescritura de logica de negocio.
	- Cambio de SQL Server por otro motor.
	- Rediseno funcional completo de frontend.

* Reglas obligatorias de ejecucion
	- Ningun cambio de produccion sin evidencia previa en STAGING.
	- Ningun secreto productivo versionado en repositorio.
	- Ninguna salida de Sprint sin validar su Definition of Done (DoD).
	- Prohibido introducir motores alternos (SQLite, PostgreSQL, MySQL, etc.).
	- Regla de comentado por avance: cuando un punto hijo se complete, se marca con prefijo //.
	- Regla de cierre de padre: cuando todos los hijos de un padre esten en //, se comenta el punto padre con //.
	- Regla de cierre de bloque: cuando un bloque se complete (por ejemplo Sprint), se comentan tambien objetivos, estrategias y requisitos relacionados.
	- Regla de trazabilidad: todo comentado con // debe tener evidencia en docs/migracion/ejecucion y validacion del usuario con la palabra Confirmado.

* Supuestos
	- SQL Server institucional y SMTP se consumen como servicios externos.
	- La entrega inicial a infraestructura se realiza con imagenes exportadas en archivos tar.
	- Seguridad aprueba mecanismo institucional de secretos.
	- Redes habilita conectividad necesaria entre contenedores y servicios externos.

* Dependencias externas
	- Certificados TLS.
	- DNS y reglas de firewall.
	- Credenciales SQL para VALIDACION, CONSULTA y RECEPCION.
	- Ventanas de cambio autorizadas.
	- Coordinacion con infraestructura para despliegue controlado en c1491.

* Riesgos iniciales y mitigacion
	- Rutas Windows hardcodeadas.
		- Mitigacion: parametrizar rutas y usar rutas relativas.
	- Uso de localhost hardcodeado.
		- Mitigacion: centralizar variables por entorno.
	- Secretos en .env versionados.
		- Mitigacion: migrar a secreto gestionado por plataforma.
	- Uploads temporales en filesystem local.
		- Mitigacion: definir volumen temporal y limpieza.
	- WebSocket detras de proxy en /cnp.
		- Mitigacion: pruebas dedicadas de handshake y reconexion en STAGING.
	- Riesgo de conectividad a SQL Server institucional.
		- Mitigacion: ventana de pruebas coordinada con DBA/redes y bloqueo de despliegue si falla.

* Metricas de control
	- Cumplimiento de backlog por Sprint.
	- Tiempo promedio de build por servicio.
	- Tamano de imagen por servicio.
	- Latencia p95 de endpoints criticos.
	- Error rate 5xx por entorno.
	- Disponibilidad de servicios en STAGING y PROD.
	- Incidentes criticos en hypercare.
*/

0. FASE PREVIA - INVESTIGACION, CONFIGURACION Y PREPARACION (2026-02-24 AL 2026-03-03)
	//0.1 Objetivo de la fase previa
		//0.1.1 Confirmar instalacion de Git para control de versiones de codigo.
	//0.2 Actividades ejecutadas
		//0.2.1 Validar Git con el comando git --version en terminal del entorno de trabajo.
	//0.3 Evidencias esperadas de fase previa
		//0.3.1 Evidencia de salida del comando git --version.
	//0.4 Cierre de fase previa
		//0.4.1 Estado: completada.
		//0.4.2 Condicion de entrada: habilita inicio del Sprint 1 a partir del 2026-03-04.

A. SPRINT 1 - DESCUBRIMIENTO Y ARQUITECTURA OBJETIVO
	A.1 Objetivo del Sprint
		A.1.1 Obtener arquitectura objetivo aprobada, backlog priorizado y riesgos controlados.
	A.2 Plan diario (5 dias)
		//A.2.1 Dia 1
			//A.2.1.1 Validar cierre documentado de Fase 0 como precondicion de inicio del Sprint.
			//A.2.1.2 Definir alcance, responsables y flujo de aprobacion.
			//A.2.1.3 Evidencia: acta registrada por lider tecnico y operaciones.
			//A.2.1.4 Definir stack preliminar (tecnologias, herramientas y tecnicas) con versiones objetivo.
			//A.2.1.5 Evidencia: catalogo preliminar del stack.
		//A.2.2 Dia 2
			//A.2.2.1 Levantar inventario de runtimes, librerias, puertos y configuraciones.
			//A.2.2.2 Ejecutar instalacion base de herramientas en estaciones de desarrollo.
			//A.2.2.3 Ejecutar instalacion base de herramientas en runner de CI.
			//A.2.2.4 Evidencia: checklist de instalacion y comandos de version validados.
			//A.2.2.5 Ejecutar instalacion de WSL2 y Docker Desktop en laptop objetivo.
			//A.2.2.6 Evidencia: salida de wsl --status y docker version en estado OK.
			//A.2.2.7 Ejecutar scripts PowerShell de instalacion de Trivy/Hadolint/SBOM en estaciones y runner (winget con fallback a chocolatey).
			//A.2.2.8 Evidencia: doble verificacion de versiones y PATH de herramientas de seguridad en terminal de VS Code y runner CI.
		//A.2.3 Dia 3
			//A.2.3.1 Definir tecnicas transversales del proyecto (build, seguridad, calidad y despliegue).
			//A.2.3.2 Definir topologia de servicios y flujo /cnp, /api, /socket.io.
			//A.2.3.3 Evidencia: documento de stack + tecnicas + arquitectura.
			//A.2.3.4 Completar instalacion y configuracion de VS Code para Docker/WSL.
			//A.2.3.5 Evidencia: listado de extensiones VS Code y apertura del workspace sin errores.
		//A.2.4 Dia 4
			//A.2.4.1 Catalogar secretos y definir estrategia institucional.
			//A.2.4.2 Evidencia: matriz de secretos + registro de riesgos.
		A.2.5 Dia 5
			//A.2.5.1 Consolidar backlog y emitir decision go/no-go.
			//A.2.5.2 Aprobar catalogo oficial y guia de instalacion completa.
			A.2.5.3 Validar prerrequisitos locales de STAGING (Docker local, conectividad SQL de VALIDACION/CONSULTA/RECEPCION y paquete de entrega a infraestructura).
			A.2.5.4 Evidencia: backlog aprobado + catalogo/guia aprobados + prueba local Docker + conectividad SQL de VALIDACION/CONSULTA/RECEPCION + validacion de permisos + checklist de entrega a infraestructura.
	A.3 Entregables obligatorios
		A.3.1 Acta de kickoff tecnico.
		//A.3.2 Inventario tecnico completo (servicios, puertos, variables, dependencias).
			//A.3.2.1 c1491 identificado como WebServer administrado por infraestructura.
			//A.3.2.2 q1491n2023 identificado como host de VALIDACION (solo lectura).
			//A.3.2.3 d1491n2023 identificado como host de CONSULTA (solo lectura operativa sobre vistas).
			//A.3.2.4 d1491n2023 identificado como host de RECEPCION (lectura/escritura).
			//A.3.2.5 Requisito registrado: migrar VALIDACION de autenticacion Windows a autenticacion SQL dedicada antes de la entrega Docker.
		A.3.3 Arquitectura objetivo por entorno (DEV/STAGING/PROD).
		A.3.4 Matriz de secretos y plan de migracion.
		A.3.5 Backlog priorizado con responsables y estimacion.
		A.3.6 Decision formal go/no-go.
		A.3.7 Catalogo oficial de tecnologias, herramientas y tecnicas del proyecto.
			A.3.7.1 Tecnologias base: Node.js 18 LTS, TypeScript 5.x, React 18, Vite 6, Express 4, Socket.IO 4, Nginx y SQL Server institucional.
			A.3.7.2 Herramientas operativas: Docker Engine/Desktop, Docker Compose v2, Git, npm, OpenSSL y curl.
			A.3.7.3 Herramientas de calidad/seguridad: ESLint, Prettier, Jest, Trivy, Hadolint y generacion de SBOM.
			A.3.7.4 Tecnicas de trabajo: multi-stage builds, configuracion por entorno (12-factor), healthchecks, versionado semantico y PR gates.
		A.3.8 Guia de instalacion completa para todo el proyecto.
			A.3.8.1 Instalacion en estaciones de desarrollo.
			A.3.8.2 Instalacion en runner de CI.
			A.3.8.3 Checklist de verificacion de instalacion (versiones y pruebas smoke).
			A.3.8.4 Scripts de instalacion PowerShell estandarizados con winget y fallback a chocolatey.
			A.3.8.5 Doble verificacion obligatoria de versiones y variables de entorno (incluyendo PATH) para herramientas base y de seguridad.
		A.3.9 Plan de instalacion especifico para laptop Windows 11 + Visual Studio Code.
			A.3.9.1 Instalar WSL2 y distro base Ubuntu con wsl --install y verificar con wsl -l -v.
			A.3.9.2 Instalar Docker Desktop y habilitar integracion WSL2.
			A.3.9.3 Configurar recursos Docker recomendados para esta laptop (6 GB RAM, 4 CPU, 80 GB disco).
			A.3.9.4 Instalar herramientas base: Git, Node.js 18 LTS, npm y OpenSSL.
			A.3.9.5 Instalar extensiones VS Code: Docker, Remote - WSL, ESLint, Prettier y GitHub Actions.
			A.3.9.6 Ejecutar validaciones: wsl --status, docker version, docker info, code --version.
			A.3.9.7 Instalar Trivy, Hadolint y herramienta de SBOM mediante script PowerShell (primero winget; si falla, chocolatey).
			A.3.9.8 Ejecutar doble validacion en terminal de VS Code de versiones y PATH para Trivy/Hadolint/SBOM.
		A.3.10 Paquete local de entrega a infraestructura para STAGING.
			A.3.10.1 Imagenes Docker exportadas en archivos tar.
			A.3.10.2 Compose de referencia para infraestructura.
			//A.3.10.3 Plantilla .env con contrato SQL de VALIDACION, CONSULTA y RECEPCION.
			A.3.10.4 Runbook de entrega en espanol.
			A.3.10.5 Manifest y checksums de artefactos.
	A.4 Definition of Done (DoD) Sprint 1
		A.4.1 Cierre documentado de Fase 0 validado como precondicion.
		A.4.2 Acta de kickoff aprobada y archivada.
		A.4.3 Inventario tecnico completo sin pendientes criticos.
		A.4.4 Arquitectura objetivo validada por desarrollo y operaciones.
		A.4.5 Matriz de secretos con plan de migracion.
		A.4.6 Backlog priorizado con responsables y esfuerzo.
		A.4.7 SQL Server institucional declarado como requisito obligatorio y no reemplazable.
		A.4.8 Catalogo oficial de tecnologias, herramientas y tecnicas aprobado.
		A.4.9 Instalacion base completada en estaciones objetivo y runner CI.
		A.4.10 Checklist de verificacion de instalacion con versiones objetivo cumplidas.
		A.4.11 WSL2 operativo y distro Linux en version 2.
		A.4.12 Docker Desktop operativo con integracion WSL2 activa.
		A.4.13 VS Code preparado para el proyecto (extensiones obligatorias instaladas).
		A.4.14 Prueba smoke de herramientas base completada (wsl/docker/code) con resultados registrados.
		A.4.15 Prerrequisitos locales de STAGING validados (Docker local, conectividad SQL de VALIDACION, CONSULTA y RECEPCION, permisos por rol y checklist de entrega a infraestructura).
		A.4.16 Herramientas de seguridad (Trivy/Hadolint/SBOM) instaladas y validadas con doble verificacion de version y PATH.
		//A.4.17 Separacion documentada de conexiones VALIDACION, CONSULTA y RECEPCION con sus roles operativos.

B. SPRINT 2 - BASE DOCKER Y ENTORNO DEV
	B.1 Objetivo del Sprint
		B.1.1 Construir base tecnica Docker y dejar DEV funcional end-to-end.
	B.2 Plan diario (5 dias)
		B.2.1 Dia 6
			B.2.1.1 Definir estandar de tags, naming y base images.
			B.2.1.2 Evidencia: documento versionado de estandar.
		B.2.2 Dia 7
			B.2.2.1 Disenar y validar Dockerfiles de backend/frontend/proxy.
			B.2.2.2 Configurar pipeline CI/CD base en runner (build + scan con Trivy/Hadolint + generacion SBOM + empaquetado local de artefactos Docker).
			B.2.2.3 Validar en runner CI la disponibilidad de Trivy/Hadolint/SBOM con doble chequeo de version y PATH.
			B.2.2.4 Evidencia: build local exitoso de imagenes + ejecucion exitosa de pipeline en rama de integracion + artefactos locales exportables + registros de verificacion de herramientas.
		B.2.3 Dia 8
			B.2.3.1 Externalizar variables y eliminar localhost hardcodeado critico.
			B.2.3.2 Evidencia: matriz de variables validada.
		B.2.4 Dia 9
			B.2.4.1 Definir y levantar stack con compose DEV.
			B.2.4.2 Evidencia: servicios arriba con healthchecks en OK.
		B.2.5 Dia 10
			B.2.5.1 Validar /cnp, /api y /socket.io en DEV y publicar runbook.
			B.2.5.2 Evidencia: checklist DEV completo.
	B.3 Entregables obligatorios
		B.3.1 Estandar de imagenes y versionado.
		B.3.2 Dockerfiles backend/frontend/proxy.
		B.3.3 docker-compose para DEV.
		B.3.4 Matriz de variables + .env.example saneado.
		B.3.5 .dockerignore optimizado.
		B.3.6 Runbook DEV v1.
		B.3.7 Pipeline CI/CD base habilitado (build, scan y empaquetado local de artefactos en entorno DEV/CI).
		B.3.8 Toolchain de seguridad operativa en CI/CD (Trivy, Hadolint y generacion de SBOM) con verificacion de version/PATH.
	B.4 Definition of Done (DoD) Sprint 2
		B.4.1 Dockerfiles construyen en entorno limpio.
		B.4.2 Compose DEV levanta stack completo y estable.
		B.4.3 Rutas /cnp, /api y /socket.io funcionan en DEV.
		B.4.4 Variables documentadas por entorno.
		B.4.5 .dockerignore reduce contexto de build de forma medible.
		B.4.6 Runbook DEV validado por al menos 2 miembros del equipo.
		B.4.7 No se incorpora ningun motor alterno a SQL Server institucional.
		B.4.8 Pipeline CI/CD base ejecuta build, scan y empaquetado en entorno controlado.
		B.4.9 Toolchain de seguridad en CI/CD validada (Trivy/Hadolint/SBOM con version y PATH correctos).

C. SPRINT 3 - INTEGRACION EXTERNA Y STAGING
	C.1 Objetivo del Sprint
		C.1.1 Dejar STAGING estable con integraciones externas y baseline de seguridad.
	C.2 Plan diario (5 dias)
		C.2.1 Dia 11
			C.2.1.1 Confirmar prerequisitos habilitados para STAGING (TLS, DNS/firewall, secretos institucionales, accesos SQL y coordinacion con infraestructura).
			C.2.1.2 Migrar secretos a mecanismo institucional y aplicar hardening inicial.
			C.2.1.3 Evidencia: checklist de prerequisitos + checklist de secretos migrados + seguridad base.
		C.2.2 Dia 12
			C.2.2.1 Entregar paquete versionado a infraestructura y ejecutar despliegue controlado en STAGING.
			C.2.2.2 Evidencia: acta de despliegue STAGING.
		C.2.3 Dia 13
			C.2.3.1 Validar conectividad y consultas criticas en SQL Server desde STAGING.
			C.2.3.2 Evidencia: reporte SQL con tiempos y resultado.
		C.2.4 Dia 14
			C.2.4.1 Validar SMTP desde STAGING (casos OK y FAIL controlados).
			C.2.4.2 Evidencia: reporte SMTP.
		C.2.5 Dia 15
			C.2.5.1 Ejecutar pruebas funcionales criticas y carga basica en STAGING.
			C.2.5.2 Evidencia: matriz funcional + performance.
	C.3 Entregables obligatorios
		C.3.1 Secretos institucionales aplicados en STAGING.
		C.3.2 Hardening inicial aplicado.
		C.3.3 Paquete versionado de imagenes entregado a infraestructura (tar + compose + env + runbook + checksums).
		C.3.4 STAGING desplegado y probado.
		C.3.5 Conectividad validada SQL Server institucional y SMTP desde STAGING.
		C.3.6 Reporte de performance basico.
	C.4 Definition of Done (DoD) Sprint 3
		C.4.1 STAGING desplegado y estable.
		C.4.2 SQL Server institucional y SMTP validados desde STAGING.
		C.4.3 Secretos sensibles fuera de repositorio.
		C.4.4 Baseline de hardening aplicada y documentada.
		C.4.5 Casos funcionales criticos aprobados.
		C.4.6 Incidencias criticas del Sprint cerradas.
		C.4.7 Validada ejecucion de consultas criticas sobre bases institucionales reales.

D. SPRINT 4 - RELEASE CANDIDATE Y READINESS
	D.1 Objetivo del Sprint
		D.1.1 Preparar release candidate con seguridad, observabilidad y rollback probado.
	D.2 Plan diario (5 dias)
		D.2.1 Dia 16
			D.2.1.1 Definir logs estructurados, metricas y alertas operativas.
			D.2.1.2 Evidencia: dashboard base + reglas de alerta.
			D.2.1.3 Verificar en runner de release candidate la disponibilidad de Trivy/Hadolint/SBOM y sus variables de entorno antes del escaneo.
			D.2.1.4 Evidencia: salida de version y PATH de herramientas de seguridad registrada.
		D.2.2 Dia 17
			D.2.2.1 Escanear imagenes y corregir vulnerabilidades criticas/altas.
			D.2.2.2 Generar SBOM por imagen.
			D.2.2.3 Evidencia: scan limpio de criticas + SBOM publicadas.
		D.2.3 Dia 18
			D.2.3.1 Definir y ejecutar simulacion de rollback en STAGING.
			D.2.3.2 Evidencia: prueba rollback con tiempo medido.
		D.2.4 Dia 19
			D.2.4.1 Congelar release candidate y ejecutar smoke/regresion/performance final.
			D.2.4.2 Evidencia: RC validada.
		D.2.5 Dia 20
			D.2.5.1 Ejecutar readiness review y confirmar plan de cambio.
			D.2.5.2 Evidencia: acta de readiness registrada.
	D.3 Entregables obligatorios
		D.3.1 Observabilidad minima (logs, metricas, alertas).
		D.3.2 Escaneo de vulnerabilidades sin criticas abiertas.
		D.3.3 SBOM por imagen.
		D.3.4 Runbook rollback probado.
		D.3.5 Acta de readiness para produccion.
	D.4 Definition of Done (DoD) Sprint 4
		D.4.1 RC congelada y trazable.
		D.4.2 Sin vulnerabilidades criticas abiertas.
		D.4.3 SBOM disponible para todas las imagenes.
		D.4.4 Rollback probado y documentado.
		D.4.5 Observabilidad minima activa en STAGING.
		D.4.6 Readiness aprobada por tecnologia y operaciones.
		D.4.7 Pruebas finales ejecutadas contra SQL Server institucional.

E. SPRINT 5 - PRODUCCION, HYPERCARE Y CIERRE
	E.1 Objetivo del Sprint
		E.1.1 Ejecutar despliegue productivo, estabilizar y transferir operacion.
	E.2 Plan diario (5 dias)
		E.2.1 Dia 21
			E.2.1.1 Ejecutar checklist pre-deploy (red, certificados, secretos, rollback).
			E.2.1.2 Evidencia: checklist registrado.
		E.2.2 Dia 22
			E.2.2.1 Desplegar release aprobada en produccion.
			E.2.2.2 Evidencia: acta de despliegue productivo.
		E.2.3 Dia 23
			E.2.3.1 Ejecutar validacion funcional critica (consultas, cargas, reportes, correos).
			E.2.3.2 Evidencia: matriz de validacion post-deploy.
		E.2.4 Dia 24
			E.2.4.1 Ejecutar hypercare y ajustes finos de configuracion.
			E.2.4.2 Evidencia: reporte de estabilizacion.
		E.2.5 Dia 25
			E.2.5.1 Ejecutar transferencia operativa y cierre formal.
			E.2.5.2 Evidencia: acta transferencia + acta cierre.
	E.3 Entregables obligatorios
		E.3.1 Produccion desplegada y validada.
		E.3.2 Hypercare con registro de incidentes.
		E.3.3 Transferencia operativa formal.
		E.3.4 Informe tecnico final.
		E.3.5 Acta de cierre ejecutivo.
	E.4 Definition of Done (DoD) Sprint 5
		E.4.1 Produccion operando en contenedores con estabilidad validada.
		E.4.2 Casos criticos de negocio en estado aprobado.
		E.4.3 Hypercare completado sin incidentes criticos abiertos.
		E.4.4 Soporte y operaciones con transferencia formal completada.
		E.4.5 Informe tecnico final y acta de cierre ejecutivo publicados.
		E.4.6 Operacion productiva validada contra SQL Server institucional.

* Hitos de aprobacion
	- Hito 0: cierre Fase 0 (2026-02-24 al 2026-03-03) con evidencias de preparacion y recuperacion validadas.
	- Hito 1: cierre Sprint 1 con go/no-go aprobado.
	- Hito 2: cierre Sprint 2 con DEV funcional.
	- Hito 3: cierre Sprint 3 con STAGING estable.
	- Hito 4: cierre Sprint 4 con readiness aprobado.
	- Hito 5: cierre Sprint 5 con go-live y transferencia.

* Gobernanza de seguimiento
	- Daily tecnico de 15 minutos.
	- Revision semanal de riesgos y bloqueos.
	- Cierre formal por Sprint con acta y evidencias.
	- Reporte tecnico al cierre de cada Sprint.
	- Reporte ejecutivo semanal de estado.
	- Reporte diario de hypercare durante Sprint 5.

