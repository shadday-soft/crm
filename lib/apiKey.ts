// Gestión de la Google Places API key.
//
// La clave se guarda en .env.local (en la raíz del proyecto). Para que funcione
// EN CALIENTE (sin reiniciar el server), no dependemos solo de process.env:
// leemos el archivo .env.local en cada petición. Orden de prioridad:
//   1. process.env.GOOGLE_PLACES_API_KEY  (si la pusiste manualmente)
//   2. archivo .env.local                 (lo que guarda la pantalla de setup)
//
// Solo se usa en el servidor (usa fs).

import { promises as fs } from "fs";
import path from "path";

const KEY_NAME = "GOOGLE_PLACES_API_KEY";
const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

/** Lee y parsea .env.local; devuelve un mapa clave->valor (vacío si no existe). */
async function readEnvLocal(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(ENV_LOCAL_PATH, "utf8");
    const map: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      // quita comillas envolventes
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      map[k] = v;
    }
    return map;
  } catch {
    return {};
  }
}

/** Devuelve la API key actual, o null si no hay ninguna configurada. */
export async function getApiKey(): Promise<string | null> {
  const fromProcess = process.env[KEY_NAME];
  if (fromProcess && fromProcess.trim()) return fromProcess.trim();

  const fileEnv = await readEnvLocal();
  const fromFile = fileEnv[KEY_NAME];
  if (fromFile && fromFile.trim()) {
    // la cacheamos en process.env para el resto de la vida del proceso
    process.env[KEY_NAME] = fromFile.trim();
    return fromFile.trim();
  }

  return null;
}

/** ¿Hay una API key configurada? */
export async function hasApiKey(): Promise<boolean> {
  return (await getApiKey()) !== null;
}

/** Guarda/actualiza la API key en .env.local preservando otras variables. */
export async function setApiKey(key: string): Promise<void> {
  const clean = key.trim();
  if (!clean) throw new Error("La clave está vacía.");

  const fileEnv = await readEnvLocal();
  fileEnv[KEY_NAME] = clean;

  const header =
    "# Archivo local — generado por la app. NO subir a git.\n" +
    "# Contiene tu Google Places API key.\n";
  const body = Object.entries(fileEnv)
    .map(([k, v]) => `${k}="${v}"`)
    .join("\n");

  await fs.writeFile(ENV_LOCAL_PATH, header + body + "\n", "utf8");

  // efectiva de inmediato en este proceso
  process.env[KEY_NAME] = clean;
}
