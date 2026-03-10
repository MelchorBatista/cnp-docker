/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/reporteNominaResumidaController.ts

/**
 * Descripcion: Genera reportes PDF de la nomina resumida consultando la vista consolidada.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { fetchNominaResumida } from './nominaResumidaController';
import { registrarAuditoria } from '../middleware/audit';

/* ───────────── Cabecera de tabla ───────────── */
const TABLE_HEADERS = ['CÓDIGO MAP', 'NOMBRE ORGANISMO', 'PODER DEL ESTADO', 'AÑO', 'MES', 'EMPLEADOS'] as const;

type HeaderKey = 'CodigoOrganismoMAP' | 'Organismo' | 'PoderDelEstado' | 'Anio' | 'Mes' | 'Empleados';

/* Orden y mapeo de campos → columnas */
const FIELD_ORDER: HeaderKey[] = ['CodigoOrganismoMAP', 'Organismo', 'PoderDelEstado', 'Anio', 'Mes', 'Empleados'];

/* Anchos relativos de columnas (suma ≈ 1.0) */
const COL_WIDTHS = [0.14, 0.34, 0.18, 0.08, 0.08, 0.18];

/* Estilos */
const BORDER = '#003876';
const HEAD_BG = '#003876';
const HEAD_FG = 'white';
const ROW_ALT_BG = '#f3f6fb';

/* Alineación por columna (datos) */
const CELL_ALIGN: Record<HeaderKey, 'left' | 'center' | 'right'> = {
  CodigoOrganismoMAP: 'center', // ← centrado
  Organismo: 'left',
  PoderDelEstado: 'left',
  Anio: 'center', // ← centrado
  Mes: 'center', // ← centrado
  Empleados: 'right',
};

interface UserPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Genera el PDF de la nomina resumida aplicando filtros opcionales por organismo o poder.
 * @param req Incluye parametros de ruta (anio/mes) y query (organismoId/poder).
 * @param res Devuelve el PDF resultante o describe el error si falla.
 * @returns Promise<void>
 */
export async function generarReporteNominaResumidaPdf(req: Request, res: Response): Promise<void> {
  try {
    const { anio, mes } = req.params;
    const anioNum = Number.parseInt(anio, 10);
    const mesNum = Number.parseInt(mes, 10);

    if (!Number.isFinite(anioNum) || !Number.isFinite(mesNum)) {
      res.status(400).json({ message: 'Parámetros inválidos (anio/mes)' });
      return;
    }

    // Filtros opcionales
    const organismoIdQS = typeof req.query.organismoId === 'string' ? req.query.organismoId : undefined;
    const poderQS = typeof req.query.poder === 'string' ? req.query.poder : undefined;

    const opts: { organismoId?: number; poder?: string } = {};
    if (organismoIdQS && /^\d+$/.test(organismoIdQS)) {
      opts.organismoId = parseInt(organismoIdQS, 10);
    }
    if (poderQS && poderQS.trim()) {
      opts.poder = poderQS.trim().toUpperCase();
    }

    // Datos
    const registros = await fetchNominaResumida(anioNum, mesNum, opts);

    // Crear PDF
    const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      // Auditoría: 6 argumentos (incluye correo)
      try {
        const user = (req as any).user as UserPayload | undefined;
        const ip = (req as any).direccionIP ?? '';
        const filtroStr =
          (opts.organismoId ? `, organismoId=${opts.organismoId}` : '') + (opts.poder ? `, poder=${opts.poder}` : '');
        if (user) {
          await registrarAuditoria(
            user.id,
            'Generar PDF',
            'NominaResumida',
            `Resumida ${anioNum}-${mesNum}${filtroStr}`,
            ip,
            user.email,
          );
        }
      } catch {
        // no romper la descarga por un fallo de auditoría
      }

      res
        .status(200)
        .setHeader(
          'Content-Disposition',
          `attachment; filename="NominaResumida_${anioNum}_${String(mesNum).padStart(2, '0')}.pdf"`,
        )
        .contentType('application/pdf')
        .send(pdfBuffer);
    });

    /* --------------------------- Encabezado --------------------------- */
    const titulo = 'NÓMINA RESUMIDA';
    const subtitulo = `Periodo: ${anioNum} - ${String(mesNum).padStart(2, '0')}`;
    const filtros: string[] = [];
    if (opts.organismoId) filtros.push(`Organismo: ${opts.organismoId}`);
    if (opts.poder) filtros.push(`Poder: ${opts.poder}`);
    const subfiltros = filtros.length ? `(${filtros.join(' · ')})` : '';

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#000')
      .text(titulo, { align: 'center' })
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(10)
      .text(`${subtitulo} ${subfiltros}`.trim(), { align: 'center' })
      .moveDown(0.8);

    /* --------------------------- Tabla --------------------------- */
    const pageW = doc.page.width;
    const usableW = pageW - doc.page.margins.left - doc.page.margins.right;

    // Header con alto dinámico y texto centrado en 1–2 líneas
    let x = doc.page.margins.left;
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);

    const colWidths = TABLE_HEADERS.map((_, i) => Math.floor(usableW * COL_WIDTHS[i]));

    // calcular alto máximo necesario por wrap de encabezados (centrados)
    const headerHeights = TABLE_HEADERS.map(
      (label, i) =>
        doc.heightOfString(label, {
          width: colWidths[i] - 12,
          align: 'center',
        }) + 8,
    );
    const headH = Math.max(...headerHeights, 24); // mínimo razonable 24pt

    TABLE_HEADERS.forEach((label, i) => {
      const w = colWidths[i];
      // fondo y borde
      doc.rect(x, y, w, headH).fillAndStroke(HEAD_BG, BORDER);

      // centrar vertical y horizontal
      const textW = w - 12;
      const textH = doc.heightOfString(label, {
        width: textW,
        align: 'center',
      });
      const textY = y + (headH - textH) / 2;

      doc.fillColor(HEAD_FG).text(label, x + 6, textY, { width: textW, align: 'center' });

      x += w;
    });

    y += headH;
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    // Body
    doc.font('Helvetica').fontSize(9).fillColor('#000');
    const rowH = 18;

    registros.forEach((r, idx) => {
      x = doc.page.margins.left;

      // Salto de página
      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      // Fondo alternado
      if (idx % 2 === 1) {
        doc.rect(x, y, usableW, rowH).fill(ROW_ALT_BG).strokeColor(ROW_ALT_BG).stroke();
      }

      // Celdas
      FIELD_ORDER.forEach((key, i) => {
        const w = colWidths[i];
        const raw = (r as any)[key];

        // Formateo por columna
        let text = '';
        if (raw == null) {
          text = '';
        } else if (key === 'Anio') {
          // ← año sin separadores y centrado
          text = String(raw);
        } else if (key === 'Mes') {
          text = String(raw);
        } else if (key === 'Empleados') {
          // miles para empleados
          text = new Intl.NumberFormat().format(Number(raw));
        } else if (typeof raw === 'number') {
          text = String(raw);
        } else {
          text = String(raw);
        }

        const align = CELL_ALIGN[key];
        // centrado vertical del texto dentro de la celda
        const textH = doc.heightOfString(text, { width: w - 12, align });
        const textY = y + (rowH - textH) / 2;

        doc.fillColor('#000').text(text, x + 6, textY, { width: w - 12, align });

        // Borde de celda (suave)
        doc.strokeColor('#e0e0e0').lineWidth(0.3).rect(x, y, w, rowH).stroke();

        x += w;
      });

      y += rowH;
    });

    // Línea final
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF resumido:', error);
    res.status(500).json({ message: 'Error al generar PDF resumido' });
  }
}
