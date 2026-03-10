/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// backend/services/reporteNominaService.ts

import { sql, connectConsulta } from '../config/connectConsulta';
const PDFDocument = require('pdfkit');

interface UserPayload {
  id: number;
  role: string;
  organismos?: number[];
}

/**
 * Obtener lista de organismos unicos desde CONSULTA.
 */
export async function fetchReporteNominaOrganismos(user: UserPayload): Promise<{ Codigo: number; Nombre: string }[]> {
  const pool = await connectConsulta();
  const baseQuery = `
    SELECT Codigo, Nombre
      FROM [dbo].[View_RNP_Datos_Nomina_OrganismosUnicos]
    ${user.role === 'institucional' && user.organismos?.length ? `WHERE Codigo IN (${user.organismos.join(',')})` : ''}
    ORDER BY Nombre
  `;
  const result = await pool.request().query(baseQuery);
  return result.recordset;
}

/**
 * Consultar datos de nomina filtrando por organismo, anio y mes.
 */
export async function fetchReporteNominaPorMes(organismoId: number, anio: number, mes: number): Promise<any[]> {
  const pool = await connectConsulta();
  const result = await pool
    .request()
    .input('CodigoOrganismoMAP', sql.Int, organismoId)
    .input('Anio', sql.Int, anio)
    .input('Mes', sql.Int, mes)
    .query(`
      SELECT *
        FROM [dbo].[View_RNP_Datos_Nomina]
       WHERE CodigoOrganismoMAP = @CodigoOrganismoMAP
         AND Anio               = @Anio
         AND Mes                = @Mes
       ORDER BY Documento, Nombres, Apellidos
    `);
  return result.recordset;
}

/**
 * Generar buffer PDF con los datos de la nomina.
 */
export async function buildReporteNominaPdf(data: any[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(18).text('Reporte de Nomina', { align: 'center' });
      doc.moveDown();

      if (data.length === 0) {
        doc.fontSize(12).text('No se encontraron registros para la nomina solicitada.', {
          align: 'center',
        });
        doc.end();
        return;
      }

      const headers = Object.keys(data[0]);
      let y = 100;
      const colWidth = (doc.page.width - 100) / headers.length;

      headers.forEach((h, i) => {
        doc.fontSize(10).text(h, 50 + i * colWidth, y);
      });
      y += 20;

      data.forEach((row) => {
        headers.forEach((h, i) => {
          const text = row[h] != null ? String(row[h]) : '';
          doc.fontSize(8).text(text, 50 + i * colWidth, y);
        });
        y += 20;
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}