# Extractos para adjuntar — Evidencia NORTIC A6

A continuación se listan extractos concretos (con ruta y snippet) que puedes pegar directamente en el expediente de certificación.

---

## 1) `backend/controllers/nominaResumidaController.ts` — filtros y query

```ts
const request = pool
  .request()
  .input("Anio", sql.Int, anio)
  .input("Mes", sql.Int, mes);

const query = `
  SELECT
    CAST(CodigoOrganismo AS VARCHAR(10)) AS CodigoOrganismoMAP,
    NombreOrganismo AS Organismo,
    PoderDelEstado,
    Anio,
    Mes,
    Empleados
  FROM DBCSASPv2.dbo.View_RNP_Datos_Nomina_Resumida
  WHERE ${where.join(" AND ")}
  ORDER BY NombreOrganismo;
`;
```

---

## 2) `backend/utils/dbPool.ts` — configuración del pool

```ts
const sqlConfig = {
  server: DB_SERVER,
  database,
  user: DB_USER,
  password: DB_PASSWORD,
  port: parseInt(DB_PORT, 10),
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 20, min: 0, idleTimeoutMillis: 30_000 },
};
```

---

## 3) `backend/server.ts` — cache warm-up y rate limiter

```ts
(async () => {
  try {
    const data = await getValidationData();
    setCachedValidationData(data);
    console.log("✅ Datos de validación cargados en caché inicialmente.");
  } catch (e: any) {
    console.error("❌ Error al cachear datos de validación:", e.message);
  }
})();

const testConnectionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Demasiadas solicitudes, intenta nuevamente más tarde.",
});
```

---

## 4) `backend/package.json` — engines y scripts

```json
"engines": { "node": ">=24.0.0 <25" }

"scripts": {
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "build": "npm run typecheck && tsc -p tsconfig.json",
  "test": "jest"
}
```

---

## 5) `backend/utils/aesGcm.ts` — cifrado seguro

```ts
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
const tag = cipher.getAuthTag();
```

---

## 6) `backend/middleware/audit.ts` — auditoría operativa

```ts
export const registrarAuditoria = async (
  usuarioID: number | null,
  tipoAccion: string,
  modulo: string,
  detalles: string,
  direccionIP: string | undefined | null,
  correoElectronico: string
): Promise<void> => {
  const ipFinal = direccionIP && direccionIP.trim() !== "" ? direccionIP : "0.0.0.0";

  const pool = await connectRecepcion();

  await pool
    .request()
    .input("UsuarioID", sql.Int, usuarioID)
    .input("NombreUsuario", sql.VarChar, correoElectronico)
    .input("TipoAccion", sql.VarChar, tipoAccion)
    .input("Modulo", sql.VarChar, modulo)
    .input("DireccionIP", sql.VarChar, ipFinal)
    .input("Detalles", sql.Text, detalles).query(`
      INSERT INTO RNP_Auditoria
        (UsuarioID, NombreUsuario, TipoAccion, Modulo, MarcaTiempo, DireccionIP, Detalles)
      VALUES
        (@UsuarioID, @NombreUsuario, @TipoAccion, @Modulo, GETDATE(), @DireccionIP, @Detalles)
    `);
```
