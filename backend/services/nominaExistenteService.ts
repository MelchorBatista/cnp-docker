/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
import { connectRecepcion, sql } from '../config/connectRecepcion';
import { registrarAuditoria } from '../middleware/audit';

/* comprobar existencia */
export async function existeNomina(anio: number, mes: number, codigoOrg: number): Promise<boolean> {
  const pool = await connectRecepcion();
  const req = new sql.Request(pool as any);
  req.input('Anio', sql.Int, anio);
  req.input('Mes', sql.Int, mes);
  req.input('Org', sql.Int, codigoOrg);

  const res = await req.query(`
    SELECT 1
    FROM [dbo].[RNP_Datos_Nomina]
    WHERE Anio = @Anio AND Mes = @Mes AND CodigoOrganismoMAP = @Org
  `);
  return res.recordset.length > 0;
}

/* borrar nomina existente */
export async function borrarNominaExistente(
  anio: number,
  mes: number,
  codigoOrg: number,
  usuarioID: number | null,
  nombreUsuario: string,
  direccionIP?: string,
): Promise<void> {
  const pool = await connectRecepcion();
  const tx = new sql.Transaction(pool as any);

  try {
    await tx.begin();

    const del = new sql.Request(tx);
    del.input('Anio', sql.Int, anio);
    del.input('Mes', sql.Int, mes);
    del.input('Org', sql.Int, codigoOrg);
    await del.query(`
      DELETE FROM [dbo].[RNP_Datos_Nomina]
      WHERE Anio = @Anio AND Mes = @Mes AND CodigoOrganismoMAP = @Org
    `);

    await tx.commit();

    await registrarAuditoria(
      usuarioID,
      'ELIMINAR_NOMINA_ANTERIOR',
      'Subir Nomina JSON',
      `Eliminada nomina ${anio}-${mes} Organismo ${codigoOrg}`,
      direccionIP,
      nombreUsuario,
    );
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}