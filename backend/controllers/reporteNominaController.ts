/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
/**
 * Descripcion: Controlador que sirve los datos y PDFs del reporte de nomina.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import * as reporteNominaService from '../services/reporteNominaService';
import { registrarAuditoria } from '../middleware/audit';

interface UserPayload {
  id: number;
  email: string;
  role: string;
  organismos?: number[];
}

const TABLE_HEADERS = [
  'DOCUMENTO',
  'NOMBRES Y APELLIDOS',
  'TIPO EMPLEADO',
  'FECHA DESIGNACION',
  'UNIDAD ORGANIZACIONAL',
  'SUELDO BASE',
  'SUELDO FUNCION',
  'AFP',
  'ISR',
  'SFS',
  'OTROS DESCUENTOS',
  'TOTAL',
] as const;

const COLUMN_WIDTHS: Record<(typeof TABLE_HEADERS)[number], number> = {
  DOCUMENTO: 0.07,
  'NOMBRES Y APELLIDOS': 0.23,
  'TIPO EMPLEADO': 0.1,
  'FECHA DESIGNACION': 0.07,
  'UNIDAD ORGANIZACIONAL': 0.2,
  'SUELDO BASE': 0.05,
  'SUELDO FUNCION': 0.05,
  AFP: 0.05,
  ISR: 0.05,
  SFS: 0.05,
  'OTROS DESCUENTOS': 0.07,
  TOTAL: 0.08,
};

const COLUMN_ALIGN: Record<(typeof TABLE_HEADERS)[number], 'left' | 'center' | 'right'> = {
  DOCUMENTO: 'center',
  'NOMBRES Y APELLIDOS': 'left',
  'TIPO EMPLEADO': 'center',
  'FECHA DESIGNACION': 'center',
  'UNIDAD ORGANIZACIONAL': 'center',
  'SUELDO BASE': 'right',
  'SUELDO FUNCION': 'right',
  AFP: 'right',
  ISR: 'right',
  SFS: 'right',
  'OTROS DESCUENTOS': 'right',
  TOTAL: 'right',
};

/* Alineaciones específicas SOLO para la fila de totales */
const TOTAL_ROW_ALIGN: Partial<Record<(typeof TABLE_HEADERS)[number], 'left' | 'center' | 'right'>> = {
  'NOMBRES Y APELLIDOS': 'right',
  'TIPO EMPLEADO': 'left',
  'UNIDAD ORGANIZACIONAL': 'right',
};

const NUMERIC_COLUMNS = new Set<string>([
  'SUELDO BASE',
  'SUELDO FUNCION',
  'AFP',
  'ISR',
  'SFS',
  'OTROS DESCUENTOS',
  'TOTAL',
]);

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type RegistroNomina = Record<string, any>;

const CELL_GETTERS: Record<(typeof TABLE_HEADERS)[number], (r: RegistroNomina) => string> = {
  DOCUMENTO: (r) => r.Documento ?? '',
  'NOMBRES Y APELLIDOS': (r) => `${r.Nombres ?? ''} ${r.Apellidos ?? ''}`.trim(),
  'TIPO EMPLEADO': (r) => r.TipoEmpleado ?? '',
  'FECHA DESIGNACION': (r) => r.FechaDesignacion ?? '',
  'UNIDAD ORGANIZACIONAL': (r) => r.UnidadOrganizacional ?? '',
  'SUELDO BASE': (r) => (r.SueldoBase != null ? r.SueldoBase.toString() : ''),
  'SUELDO FUNCION': (r) => (r.SueldoFuncion != null ? r.SueldoFuncion.toString() : ''),
  AFP: (r) => (r.AFP != null ? r.AFP.toString() : ''),
  ISR: (r) => (r.ISR != null ? r.ISR.toString() : ''),
  SFS: (r) => (r.SFS != null ? r.SFS.toString() : ''),
  'OTROS DESCUENTOS': (r) => (r.OtrosDescuentos != null ? r.OtrosDescuentos.toString() : ''),
  TOTAL: (r) => (r.Total != null ? r.Total.toString() : ''),
};

/* ────────────────────────────  RUTAS AUXILIARES  ──────────────────────────── */

/**
 * Devuelve la lista de organismos que pueden generar reportes de nomina.
 * @param req Request con el usuario autenticado en el contexto.
 * @param res Respuesta con el arreglo de organismos o mensaje de error.
 * @returns Promise<void>
 */
export async function getReporteNominaOrganismos(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).user as UserPayload;
    const organismos = await reporteNominaService.fetchReporteNominaOrganismos(user);
    res.json(organismos);
  } catch (error) {
    console.error('Error al cargar organismos únicos:', error);
    res.status(500).json({ message: 'Error al cargar organismos' });
  }
}

/**
 * Consulta los datos de nomina para un organismo, anio y mes especificos.
 * @param req Incluye los parametros de consulta via querystring.
 * @param res Entrega la coleccion de registros o el error correspondiente.
 * @returns Promise<void>
 */
export async function getReporteNominaPorMes(req: Request, res: Response): Promise<void> {
  try {
    const { organismoId, year, mes } = req.query;
    const orgId = Number(organismoId);
    const anio = Number(year);
    const mesNum = Number(mes);
    if ([orgId, anio, mesNum].some((v) => isNaN(v))) {
      res.status(400).json({ message: 'Parámetros inválidos' });
      return;
    }
    const datos = await reporteNominaService.fetchReporteNominaPorMes(orgId, anio, mesNum);
    res.json(datos);
  } catch (error) {
    console.error('Error al obtener datos de nómina por mes:', error);
    res.status(500).json({ message: 'Error al cargar datos de nómina' });
  }
}

/* ───────────────────────────  GENERACIÓN DEL PDF  ─────────────────────────── */

/**
 * Genera el PDF de nomina con totales y deja constancia en la auditoria.
 * @param req Recoge organismo, anio y mes deseados.
 * @param res Retorna el PDF o informa por que no se pudo generar.
 * @returns Promise<void>
 */
export async function generarReporteNominaPdf(req: Request, res: Response): Promise<void> {
  try {
    const { organismoId, year, mes } = req.query;
    const orgId = Number(organismoId);
    const anio = Number(year);
    const mesNum = Number(mes);

    if ([orgId, anio, mesNum].some((v) => isNaN(v))) {
      res.status(400).json({ message: 'Parámetros inválidos' });
      return;
    }

    const registros = await reporteNominaService.fetchReporteNominaPorMes(orgId, anio, mesNum);
    if (!registros || registros.length === 0) {
      res.status(404).json({ message: 'No se encontraron registros de nómina' });
      return;
    }

    /* ----------------------------- Totales ----------------------------- */
    const totals: Record<string, number> = {
      'SUELDO BASE': 0,
      'SUELDO FUNCION': 0,
      AFP: 0,
      ISR: 0,
      SFS: 0,
      'OTROS DESCUENTOS': 0,
      TOTAL: 0,
    };

    registros.forEach((r) => {
      totals['SUELDO BASE'] += Number(r.SueldoBase ?? 0);
      totals['SUELDO FUNCION'] += Number(r.SueldoFuncion ?? 0);
      totals.AFP += Number(r.AFP ?? 0);
      totals.ISR += Number(r.ISR ?? 0);
      totals.SFS += Number(r.SFS ?? 0);
      totals['OTROS DESCUENTOS'] += Number(r.OtrosDescuentos ?? 0);
      totals.TOTAL += Number(r.Total ?? 0);
    });

    const empleadosCount = registros.length;

    /* ----------------------------- PDF ----------------------------- */
    const organismoNombre = registros[0].Organismo ?? 'Organismo Desconocido';
    const doc = new PDFDocument({ size: 'LETTER', margin: 14.17 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const user = (req as any).user as UserPayload;
      const ip = (req as any).direccionIP ?? '';

      await registrarAuditoria(
        user.id,
        'Generar PDF',
        'ReporteNomina',
        `Reporte de nómina ${anio}-${mesNum} org ${orgId}`,
        ip,
        user.email,
      );

      res
        .header('Content-Type', 'application/pdf')
        .attachment(`ReporteNomina_${orgId}_${anio}_${mesNum}.pdf`)
        .send(pdfBuffer);
    });

    /* --------------------------- Encabezado --------------------------- */
    doc.font('Helvetica-Bold').fontSize(16).text(organismoNombre, { align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(9) // 75 % de 12 pt
      .text('Reporte de Nómina', { align: 'center' })
      .moveDown(0.25)
      .text(`Periodo de Nómina: ${anio} - ${mesNum}`, { align: 'center' });
    doc.moveDown(1);

    /* ------------------ Anchos de columnas ------------------ */
    const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const sumWeights = TABLE_HEADERS.reduce((acc, h) => acc + COLUMN_WIDTHS[h], 0);
    const colWidths = TABLE_HEADERS.map((h) => (COLUMN_WIDTHS[h] / sumWeights) * availableWidth);

    /* ------------------ Header de tabla ------------------ */
    let x = doc.page.margins.left;
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(4);

    const headerHeightsArr = TABLE_HEADERS.map(
      (h, i) => doc.heightOfString(h, { width: colWidths[i] - 4, align: 'center' }) + 4,
    );
    const headerHeight = Math.max(...headerHeightsArr);

    TABLE_HEADERS.forEach((h, i) => {
      const w = colWidths[i];
      doc.rect(x, y, w, headerHeight).fill('#003876'); // fondo azul
      const textWidth = w - 4;
      const textHeight = doc.heightOfString(h, {
        width: textWidth,
        align: 'center',
      });
      const textY = y + headerHeight - textHeight - 2; // 2 pt bottom padding
      doc.fillColor('white').text(h, x + 2, textY, { width: textWidth, align: 'center' });
      doc.strokeColor('#003876').lineWidth(0.5).rect(x, y, w, headerHeight).stroke();
      x += w;
    });

    /* ------------------ Filas de detalle ------------------ */
    doc.font('Helvetica').fontSize(4);
    y += headerHeight;

    registros.forEach((reg) => {
      const rowHeightsArr = TABLE_HEADERS.map((h, i) => {
        let val = CELL_GETTERS[h](reg);
        if (NUMERIC_COLUMNS.has(h) && !isNaN(Number(val))) val = formatNumber(Number(val));
        return (
          doc.heightOfString(val, {
            width: colWidths[i] - 4,
            align: COLUMN_ALIGN[h],
          }) + 4
        );
      });

      const rowHeight = Math.max(...rowHeightsArr);
      x = doc.page.margins.left;

      TABLE_HEADERS.forEach((h, i) => {
        const w = colWidths[i];
        let val = CELL_GETTERS[h](reg);
        if (NUMERIC_COLUMNS.has(h) && !isNaN(Number(val))) val = formatNumber(Number(val));

        doc.rect(x, y, w, rowHeight).fill('#FFFFFF');
        doc.fillColor('black').text(val, x + 2, y + 2, {
          width: w - 4,
          align: COLUMN_ALIGN[h],
        });
        doc.strokeColor('#000000').lineWidth(0.3).rect(x, y, w, rowHeight).stroke();
        x += w;
      });

      y += rowHeight;
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.y = y;
    });

    /* ------------------ Fila de totales ------------------ */
    const totalRowVals = TABLE_HEADERS.map((h) => {
      switch (h) {
        case 'DOCUMENTO':
          return ''; // 2) sin "TOTALES"
        case 'NOMBRES Y APELLIDOS':
          return 'Cantidad de Empleados'; // 3)
        case 'TIPO EMPLEADO':
          return empleadosCount.toString(); // 4)
        case 'UNIDAD ORGANIZACIONAL':
          return 'Totales :'; // 1)
        default:
          return NUMERIC_COLUMNS.has(h) ? formatNumber(totals[h]) : '';
      }
    });

    const totalRowHeightsArr = totalRowVals.map(
      (val, i) =>
        doc.heightOfString(val, {
          width: colWidths[i] - 4,
          align: TOTAL_ROW_ALIGN[TABLE_HEADERS[i]] ?? COLUMN_ALIGN[TABLE_HEADERS[i]],
        }) + 4,
    );

    const totalRowHeight = Math.max(...totalRowHeightsArr);

    if (y + totalRowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    x = doc.page.margins.left;
    doc.font('Helvetica-Bold').fontSize(4);

    TABLE_HEADERS.forEach((h, i) => {
      const w = colWidths[i];
      const val = totalRowVals[i];
      doc.rect(x, y, w, totalRowHeight).fill('#003876');
      doc.fillColor('white').text(val, x + 2, y + 2, {
        width: w - 4,
        align: TOTAL_ROW_ALIGN[h] ?? COLUMN_ALIGN[h],
      });
      doc.strokeColor('#003876').lineWidth(0.5).rect(x, y, w, totalRowHeight).stroke();
      x += w;
    });

    /* ------------------ Fin ------------------ */
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de nómina:', error);
    res.status(500).json({ message: 'Error al generar PDF de nómina' });
  }
}
