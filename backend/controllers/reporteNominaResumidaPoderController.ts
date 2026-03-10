/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/reporteNominaResumidaPoderController.ts

/**
 * Descripcion: Construye los reportes PDF de nomina resumida filtrados por poder del Estado.
 * Autor: Equipo CNP
 * Ultima modificacion: 2025-12-05
 */
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { fetchNominaResumidaPorPoder, ALLOWED_PODERES } from './poderNominaResumidaController';
import { registrarAuditoria } from '../middleware/audit';

const TABLE_HEADERS = ['CÓDIGO MAP', 'NOMBRE ORGANISMO', 'PODER DEL ESTADO', 'AÑO', 'MES', 'EMPLEADOS'] as const;

type HeaderKey = 'CodigoOrganismoMAP' | 'Organismo' | 'PoderDelEstado' | 'Anio' | 'Mes' | 'Empleados';

const FIELD_ORDER: HeaderKey[] = ['CodigoOrganismoMAP', 'Organismo', 'PoderDelEstado', 'Anio', 'Mes', 'Empleados'];

const COL_WIDTHS = [0.14, 0.34, 0.18, 0.08, 0.08, 0.18];

const BORDER = '#003876';
const HEAD_BG = '#003876';
const HEAD_FG = 'white';
const ROW_ALT_BG = '#f3f6fb';

const CELL_ALIGN: Record<HeaderKey, 'left' | 'center' | 'right'> = {
  CodigoOrganismoMAP: 'center',
  Organismo: 'left',
  PoderDelEstado: 'left',
  Anio: 'center',
  Mes: 'center',
  Empleados: 'right',
};

interface UserPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Genera el PDF filtrado por poder tomando como entrada los parametros anio, mes y poder.
 * @param req Solicitud HTTP con parametros de ruta y querystring.
 * @param res Respuesta que entrega el PDF o el error de validacion.
 * @returns Promise<void>
 */
export async function generarReporteNominaResumidaPoderPdf(req: Request, res: Response): Promise<void> {
  try {
    const { anio, mes } = req.params;
    const poderQS = typeof req.query.poder === 'string' ? req.query.poder : '';
    const anioNum = parseInt(anio, 10);
    const mesNum = parseInt(mes, 10);

    if (!Number.isFinite(anioNum) || !Number.isFinite(mesNum) || !poderQS) {
      res.status(400).json({ message: 'Parámetros inválidos (anio/mes/poder)' });
      return;
    }

    const poder = poderQS.trim();
    if (!ALLOWED_PODERES.has(poder)) {
      res.status(400).json({
        message:
          "Valor de 'poder' inválido. Debe ser uno de: PODER EJECUTIVO | PODER LEGISLATIVO | PODER JUDICIAL | GOBIERNO LOCAL | ORGANISMO AUTONOMO",
      });
      return;
    }

    const registros = await fetchNominaResumidaPorPoder(anioNum, mesNum, poder);

    const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      try {
        const user = (req as any).user as UserPayload | undefined;
        const ip = (req as any).direccionIP ?? '';
        if (user) {
          await registrarAuditoria(
            user.id,
            'Generar PDF',
            'NominaResumidaPoder',
            `ResumidaPoder ${anioNum}-${mesNum}, poder=${poder}`,
            ip,
            user.email,
          );
        }
      } catch {
        /* no romper descarga por auditoría */
      }

      res
        .status(200)
        .setHeader(
          'Content-Disposition',
          `attachment; filename="NominaResumidaPoder_${anioNum}_${String(mesNum).padStart(
            2,
            '0',
          )}_${poder.replace(/\s+/g, '')}.pdf"`,
        )
        .contentType('application/pdf')
        .send(pdfBuffer);
    });

    /* Encabezado */
    const titulo = 'NÓMINA RESUMIDA — PODER DEL ESTADO';
    const subtitulo = `Periodo: ${anioNum} - ${String(mesNum).padStart(2, '0')} (Poder: ${poder})`;

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#000')
      .text(titulo, { align: 'center' })
      .moveDown(0.2)
      .font('Helvetica')
      .fontSize(10)
      .text(subtitulo, { align: 'center' })
      .moveDown(0.8);

    /* Tabla */
    const pageW = doc.page.width;
    const usableW = pageW - doc.page.margins.left - doc.page.margins.right;

    let x = doc.page.margins.left;
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);

    const colWidths = TABLE_HEADERS.map((_, i) => Math.floor(usableW * COL_WIDTHS[i]));

    const headerHeights = TABLE_HEADERS.map(
      (label, i) =>
        doc.heightOfString(label, {
          width: colWidths[i] - 12,
          align: 'center',
        }) + 8,
    );
    const headH = Math.max(...headerHeights, 24);

    TABLE_HEADERS.forEach((label, i) => {
      const w = colWidths[i];
      doc.rect(x, y, w, headH).fillAndStroke(HEAD_BG, BORDER);

      const textW = w - 12;
      const textH = doc.heightOfString(label, {
        width: textW,
        align: 'center',
      });
      const textY = y + (headH - textH) / 2;

      doc.fillColor(HEAD_FG).text(label, x + 6, textY, {
        width: textW,
        align: 'center',
      });

      x += w;
    });

    y += headH;
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    doc.font('Helvetica').fontSize(9).fillColor('#000');
    const rowH = 18;

    registros.forEach((r, idx) => {
      x = doc.page.margins.left;

      if (y + rowH > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      if (idx % 2 === 1) {
        doc.rect(x, y, usableW, rowH).fill('#f3f6fb').strokeColor('#f3f6fb').stroke();
      }

      FIELD_ORDER.forEach((key, i) => {
        const w = colWidths[i];
        const raw = (r as any)[key];

        let text = '';
        if (raw == null) text = '';
        else if (key === 'Anio') text = String(raw);
        else if (key === 'Mes') text = String(raw);
        else if (key === 'Empleados') text = new Intl.NumberFormat().format(Number(raw));
        else text = String(raw);

        const align =
          key === 'CodigoOrganismoMAP' || key === 'Anio' || key === 'Mes'
            ? 'center'
            : key === 'Empleados'
              ? 'right'
              : 'left';

        const textH = doc.heightOfString(text, { width: w - 12, align });
        const textY = y + (rowH - textH) / 2;

        doc.fillColor('#000').text(text, x + 6, textY, {
          width: w - 12,
          align,
        });

        doc.strokeColor('#e0e0e0').lineWidth(0.3).rect(x, y, w, rowH).stroke();

        x += w;
      });

      y += rowH;
    });

    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF resumido por poder:', error);
    res.status(500).json({ message: 'Error al generar PDF resumido por poder' });
  }
}
