/**
 * Ministerio de Administración Pública (MAP)
 * Portal para Información Complementaria de Nóminas Públicas (CNP)
 * Desarrollador: Dionicio Melchor Batista Jerez
 * Base de datos: Christian Sánchez Pérez
 * Coordinador: Lucas Almonte
 */
// src/utils/cryptoUtils.ts

import CryptoJS from "crypto-js";

// La variable de entorno VITE_SECRET_KEY debe tener el mismo valor que JWT_SECRET en el backend.
const secretKey = import.meta.env.VITE_SECRET_KEY || "default_secret_key";

/**
 * Deriva la clave de 256 bits (32 bytes) a partir de secretKey usando SHA256.
 * @returns La clave derivada en formato hexadecimal.
 */
export function getDerivedKeyHex(): string {
  const derived = CryptoJS.SHA256(secretKey).toString(CryptoJS.enc.Hex);
  console.log("===================================");
  console.log("Frontend Derived Key:");
  console.log(derived);
  console.log("===================================");
  return derived;
}

/**
 * Función de depuración: Imprime en consola la clave "esperada".
 * Para obtener la clave esperada, puedes calcularla externamente (por ejemplo, con OpenSSL):
 *
 *   echo -n 'mi_clave_secreta' | openssl dgst -sha256
 *
 * Luego, reemplaza 'expected_value' por el resultado (en minúsculas y sin espacios).
 */
export function logExpectedDerivedKey(): void {
  const expectedDerivedKey = "expected_value"; // Reemplaza "expected_value" con el hash que obtuviste
  console.log("===================================");
  console.log("Expected Backend Derived Key:");
  console.log(expectedDerivedKey);
  console.log("===================================");
}

/**
 * Descifra un valor cifrado en el formato "iv:encryptedText" utilizando AES-256-CBC.
 * @param encryptedValue La cadena cifrada.
 * @returns El valor descifrado en texto plano.
 */
export function decryptValue(encryptedValue: string): string {
  const parts = encryptedValue.split(":");
  if (parts.length !== 2) {
    console.error("Formato de valor cifrado incorrecto:", encryptedValue);
    return "";
  }
  const [ivHex, encryptedHex] = parts;
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const ciphertext = CryptoJS.enc.Hex.parse(encryptedHex);
  const key = CryptoJS.SHA256(secretKey);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: ciphertext,
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
