// Deriva una "zona" (ciudad/localidad) a partir de la dirección formateada de
// Google. Es heurístico: Google devuelve algo como
//   "Calle Mayor 1, 28013 Madrid, España"
// y nos quedamos con "Madrid". El usuario puede editar la zona luego.

export function deriveZone(address?: string | null): string | undefined {
  if (!address) return undefined;
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;

  // El último suele ser el país; tomamos el penúltimo (la ciudad).
  let candidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

  // Quita código postal al principio o al final: "28013 Madrid" -> "Madrid".
  candidate = candidate
    .replace(/^\d{4,6}\s+/, "")
    .replace(/\s+\d{4,6}$/, "")
    .trim();

  if (!candidate || /^\d+$/.test(candidate)) {
    candidate = parts[parts.length - 1];
  }
  return candidate || undefined;
}
