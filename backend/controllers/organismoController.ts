/**
 * Ministerio de Administracion Publica (MAP)
 * Portal para Informacion Complementaria de Nominas Publicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sanchez Perez
 * Coordinador: Lucas Almonte
 */
// backend/controllers/organismoController.ts

/**
 * Descripcion: Controlador para listar organismos desde la base VALIDACION.
 * Autor: Equipo CNP
 * Ultima modificacion: 2026-03-06
 */
import { RequestHandler } from 'express';
import { connectValidacion } from '../config/connectValidacion';

/**
 * Devuelve la lista de organismos con sus relaciones descriptivas.
 * La lectura se realiza exclusivamente sobre VALIDACION.
 */
export const getOrganismos: RequestHandler = async (_req, res) => {
  try {
    const pool = await connectValidacion();
    const consulta = `
      SELECT
          o.[OrganismoID],
          o.[TipoOrganismoID],
          o.[CategoriaHospitalID],
          o.[ClasificadorID],
          o.[NivelAutonomiaPadreID],
          o.[ProvinciaID],
          ng.[Descripcion] AS NivelGobierno,
          tg.[Descripcion] AS TipoGobierno,
          sg.[Descripcion] AS SectorGobierno,
          torg.[Descripcion] AS TipoOrganismo,
          cl.[Descripcion] AS Clasificador,
          nap.[Descripcion] AS NivelAutonomiaPadre,
          p.[Nombre] AS Provincia,
          o.[Nombre],
          o.[Siglas],
          o.[Logo],
          o.[Direccion1],
          o.[Direccion2],
          o.[Telefono],
          o.[EMail],
          o.[Web],
          o.[TelefonoServicio],
          o.[Horario],
          o.[Departamento],
          o.[RNC],
          o.[RNC2],
          o.[OAI],
          o.[COEDOM],
          o.[SMMGP],
          o.[SALUD],
          o.[OBSERVATORIO],
          o.[SASP],
          o.[BDCSASP],
          o.[SIGEI],
          o.[CLIMA],
          o.[PNC],
          o.[PRC],
          o.[TSS],
          o.[UNIDPROCSASP],
          o.[BDGSERP],
          o.[SASPDENTROOTRA],
          o.[SASPESTUVOEN],
          o.[Contraloria],
          o.[Tipologia2],
          o.[EsRegional],
          o.[PoliticasTransversales],
          o.[AplicaCodigoTrabajo],
          o.[MotivoID],
          o.[ComentarioCierre],
          o.[FechaUltModificacion],
          o.[Favorito],
          o.[Vigente],
          o.[FechaCierre]
      FROM [dbo].[Organismos] o
      LEFT JOIN [dbo].[NivelGobierno] ng ON o.[NivelGobiernoID] = ng.[NivelGobiernoID]
      LEFT JOIN [dbo].[TipoGobierno] tg ON o.[TipoGobiernoID] = tg.[TipoGobiernoID]
      LEFT JOIN [dbo].[SectorGobierno] sg ON o.[SectorGobiernoID] = sg.[SectorGobiernoID]
      LEFT JOIN [dbo].[TipoOrganismo] torg ON o.[TipoOrganismoID] = torg.[TipoOrganismoID]
      LEFT JOIN [dbo].[Clasificador] cl ON o.[ClasificadorID] = cl.[ClasificadorID]
      LEFT JOIN [dbo].[NivelAutonomiaPadre] nap ON o.[NivelAutonomiaPadreID] = nap.[NivelAutonomiaPadreID]
      LEFT JOIN [dbo].[Provincias] p ON o.[ProvinciaID] = p.[ProvinciaID]
      ORDER BY o.[Nombre];
    `;

    const resultado = await pool.request().query(consulta);
    res.json(resultado.recordset);
    return;
  } catch (error) {
    console.error('Error al obtener organismos desde VALIDACION:', error);
    res.status(500).json({
      error: 'Error interno',
      details: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};