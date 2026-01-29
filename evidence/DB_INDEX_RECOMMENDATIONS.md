# Recomendaciones de índices (adjuntar como evidencia de indexabilidad)

Basado en las consultas encontradas en `backend/controllers/*`, se recomiendan los siguientes índices para mejorar rendimiento y justificar "indexabilidad" en la certificación.

## Suggested indexes

- Tabla/vista: `DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida`
  - Índice compuesto: `(Anio, Mes)` — típico para búsquedas por periodo.
  - Índice adicional: `PoderDelEstado` — si se realizan consultas frecuentes filtrando por poder.
  - Índice adicional: `CodigoOrganismo` — si se filtra por organismo.

## Ejemplo SQL (para DBA)

```sql
-- Índice compuesto por periodo
CREATE NONCLUSTERED INDEX IX_View_Nomina_Anio_Mes
ON DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida(Anio, Mes);

-- Índice por poder del estado
CREATE NONCLUSTERED INDEX IX_View_Nomina_Poder
ON DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida(PoderDelEstado);

-- Índice por CodigoOrganismo (si aplica)
CREATE NONCLUSTERED INDEX IX_View_Nomina_CodigoOrganismo
ON DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida(CodigoOrganismo);
```

## Notas

- Validar con el DBA los índices exactos y su selectividad; las recomendaciones son puntos de partida para la evidencia de índice/promovida en la certificación.
