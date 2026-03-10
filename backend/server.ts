/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/server.ts

/**
 * Descripcion: Configura y arranca la API principal de recepcion de nominas.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Cargar .env.local o .env.production según NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(__dirname, envFile) });

// DB connections
import { connectRecepcion } from './config/connectRecepcion';
import { connectValidacion, getValidationData } from './config/connectValidacion';
import { connectConsulta } from './config/connectConsulta';

// Routers
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import protectedRoutes from './routes/protectedRoutes';
import roleRoutes from './routes/roleRoutes';
import organismoRoutes from './routes/organismoRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import dashboardAuditRoutes from './routes/dashboardAuditRoutes';
import validationDataRoutes from './routes/validationDataRoutes';
import RecibirNominaJSONRoutes from './routes/recibirNominaJSONroutes';
import reporteNominaRoutes from './routes/reporteNominaRoutes';
import nominaResumidaRoutes from './routes/nominaResumidaRoutes';
import reporteNominaResumidaRoutes from './routes/reporteNominaResumidaRoutes';
import nominaExistenteRoutes from './routes/nominaExistenteRoutes';
import poderNominaResumidaRoutes from './routes/poderNominaResumidaRoutes';

// Services
import { setCachedValidationData } from './services/validationDataService';
import {
  procesarNominaJSON,
  procesarIntentoNominaFallido,
  IntentoNomina,
  ReporteErroresNomina,
} from './services/recibirNominaService';

/* ----------------------------------------
 * Helpers / Env
 * -------------------------------------- */
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3000);
const TRUST_PROXY = String(process.env.TRUST_PROXY || 'true').toLowerCase() === 'true';

/**
 * Normaliza rutas de entorno garantizando que inicien con slash y tengan fallback.
 * @param p Cadena proporcionada por la configuracion.
 * @param fallback Ruta alternativa cuando no se define valor.
 * @returns String listo para usarse en middlewares o prefijos.
 */
function normalizePath(p: string, fallback = '/'): string {
  const s = (p || fallback).trim();
  if (!s) return fallback;
  return s.startsWith('/') ? s : `/${s}`;
}
/**
 * Une prefijos cuidando duplicidad de diagonales.
 * @param a Primera parte de la ruta.
 * @param b Segmento que se anexara.
 * @returns Ruta concatenada.
 */
function joinPath(a: string, b: string): string {
  const A = normalizePath(a, '/');
  const B = normalizePath(b, '/');
  if (A === '/') return B;
  return `${A}${B}`;
}

const BASE_PATH = normalizePath(process.env.BASE_PATH || '/');
const API_PREFIX = normalizePath(process.env.API_PREFIX || '/api');
const SOCKETIO_PATH = normalizePath(process.env.SOCKETIO_PATH || '/socket.io');

// CORS origins
/**
 * Construye la lista de origenes permitidos desde la configuracion.
 * @returns Arreglo sin duplicados utilizado por CORS.
 */
function buildCorsOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return Array.from(new Set(fromEnv));
}
const corsOrigins = buildCorsOrigins();

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin || origin === 'null') return cb(null, true);
    if (corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

/* ----------------------------------------
 * Express App
 * -------------------------------------- */
const app = express();
const server = http.createServer(app);

if (TRUST_PROXY) app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '400mb' }));
app.use(express.urlencoded({ extended: true, limit: '400mb' }));

import capturarIP from './middleware/capturarIP';
app.use(capturarIP);

/* ----------------------------------------
 * Rutas API
 * -------------------------------------- */
const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

const testConnectionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiadas solicitudes, intenta nuevamente más tarde.',
});
/**
 * Valida conectividad hacia las bases principales para monitoreo.
 * @param _req Request HTTP (no usa parametros del cliente).
 * @param res Respuesta con el resultado de las conexiones.
 * @returns Promise<void>
 */
const testConnectionsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [recepcion, validacion, consulta] = await Promise.all([connectRecepcion(), connectValidacion(), connectConsulta()]);
    if (recepcion && validacion && consulta) {
      res.status(200).json({ mensaje: 'Conexion exitosa a RECEPCION, VALIDACION y CONSULTA.' });
    } else {
      res.status(500).json({ mensaje: 'No se pudo conectar a todas las bases de datos configuradas.' });
    }
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error de BD', error: err.message });
  }
};
apiRouter.use('/test-connections', testConnectionsLimiter, testConnectionsHandler);

apiRouter.use('/usuarios', userRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/protected', protectedRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/organismos', organismoRoutes);
apiRouter.use('/asignaciones', assignmentRoutes);
apiRouter.use('/dashboard-auditoria', dashboardAuditRoutes);
apiRouter.use('/validation', validationDataRoutes);
apiRouter.use('/nomina', nominaExistenteRoutes);
apiRouter.use('/reporte-nomina-resumida', reporteNominaResumidaRoutes);
apiRouter.use('/reporte-nomina', reporteNominaRoutes);
apiRouter.use('/nomina-resumida', nominaResumidaRoutes);
apiRouter.use('/nomina-resumida-poder', poderNominaResumidaRoutes);
apiRouter.use('/recibir-nomina-json', RecibirNominaJSONRoutes);

const API_BASE_PRIMARY = joinPath(BASE_PATH, API_PREFIX);
const API_BASE_DIRECT = API_PREFIX;

app.use(API_BASE_PRIMARY, apiRouter);
app.use(API_BASE_DIRECT, apiRouter);
app.use('/auth', authRoutes);
app.use('/RecibirNominaJSON', RecibirNominaJSONRoutes);

app.get('/', (_req, res: Response) => {
  res.send('✅ Backend: Recepción de Nóminas Públicas - FUNCIONANDO -');
});

/* ----------------------------------------
 * Error handler
 * -------------------------------------- */
/**
 * Middleware final que captura errores no manejados y estandariza la respuesta.
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error en el servidor:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

/* ----------------------------------------
 * Warm cache
 * -------------------------------------- */
/**
 * Inicializa el cache de datos de validacion al arrancar el servidor.
 */
(async () => {
  try {
    const data = await getValidationData();
    setCachedValidationData(data);
    console.log('✅ Datos de validación cargados en caché inicialmente.');
  } catch (e: any) {
    console.error('❌ Error al cachear datos de validación:', e.message);
  }
})();

/* ----------------------------------------
 * Socket.IO
 * -------------------------------------- */
export const io = new Server(server, {
  path: SOCKETIO_PATH,
  cors: {
    origin(origin, cb) {
      if (!origin || origin === 'null') return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

function getClientIpFromSocket(s: import('socket.io').Socket): string {
  const xfwd = s.handshake.headers['x-forwarded-for'];
  if (Array.isArray(xfwd)) return xfwd[0];
  if (typeof xfwd === 'string' && xfwd.length) return xfwd.split(',')[0].trim();
  return s.handshake.address || '';
}

let nominaHeader: Partial<IntentoNomina> = {};

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  socket.on(
    'enviarNominaChunk',
    async (
      chunk: {
        header?: Partial<IntentoNomina>;
        data: any[];
      },
      callback: (resp: { error?: string }) => void,
    ): Promise<void> => {
      if (chunk.header) nominaHeader = chunk.header;

      const intento: IntentoNomina = {
        UsuarioID: nominaHeader.UsuarioID ?? null,
        NombreUsuario: nominaHeader.NombreUsuario ?? '',
        FechaHora: nominaHeader.FechaHora ?? '',
        ResultadoIntento: nominaHeader.ResultadoIntento ?? '',
        EncabezadoValido: nominaHeader.EncabezadoValido ?? false,
        DetalleValido: nominaHeader.DetalleValido ?? false,
        CantidadEmpleados: nominaHeader.CantidadEmpleados ?? 0,
        EmpleadosInvalidos: chunk.data.length,
        Anio: nominaHeader.Anio ?? 0,
        Mes: nominaHeader.Mes ?? 0,
        CodigoOrganismoMAP: nominaHeader.CodigoOrganismoMAP ?? 0,
        Detalle: chunk.data,
      };

      try {
        await procesarNominaJSON(intento);
        callback({});
      } catch (err: any) {
        console.error('[Socket.io] Error procesando chunk:', err);

        const clientIp = getClientIpFromSocket(socket);
        await procesarIntentoNominaFallido(intento as ReporteErroresNomina, clientIp);

        callback({ error: err?.message || 'Error procesando nominación' });
      }
    },
  );

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id} (${reason})`);
  });
});

/* ----------------------------------------
 * Start server
 * -------------------------------------- */
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
  console.log(`   BASE path: ${BASE_PATH}`);
  console.log(`   API prefix: ${API_PREFIX}`);
  console.log(`   API mounts: ${API_BASE_PRIMARY}  &  ${API_BASE_DIRECT}`);
  console.log(`   Socket.IO path: ${SOCKETIO_PATH}`);
  console.log(`   CORS allowed: ${corsOrigins.join(', ') || '(none)'}`);
});

export default app;
// ----------------------------------------
