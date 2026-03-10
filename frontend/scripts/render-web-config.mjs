import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, "..", "public");
const templatePath = path.join(publicDir, "web.config.template");
const outputPath = path.join(publicDir, "web.config");

const upstream =
  process.env.IIS_BACKEND_UPSTREAM?.trim() ||
  process.env.FRONTEND_WEB_BACKEND_UPSTREAM?.trim() ||
  "http://backend:3000";

if (!fs.existsSync(templatePath)) {
  throw new Error(`No existe la plantilla ${templatePath}`);
}

const template = fs.readFileSync(templatePath, "utf8");
const rendered = template.replace(/__IIS_BACKEND_UPSTREAM__/g, upstream);

fs.writeFileSync(outputPath, rendered, "utf8");
console.log(
  `[render-web-config] web.config generado con IIS_BACKEND_UPSTREAM=${upstream}`
);
