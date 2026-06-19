// Crea un usuario administrador por defecto si la tabla de usuarios está vacía.
// Ejecutar con:  npm run db:seed
// Credenciales configurables por env: DEFAULT_ADMIN_EMAIL / DEFAULT_ADMIN_PASSWORD.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`Ya existen ${count} usuario(s). No se crea el admin por defecto.`);
    return;
  }

  const email = (process.env.DEFAULT_ADMIN_EMAIL || "erick.cantillo97@gmail.com").trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "prospecta123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, name: "Administrador", role: "ADMIN", passwordHash },
  });

  console.log("✔ Usuario administrador creado:");
  console.log("    Correo:     " + email);
  console.log("    Contraseña: " + password);
  console.log("  Cámbiala después de iniciar sesión.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
