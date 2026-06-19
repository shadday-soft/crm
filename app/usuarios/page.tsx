import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UserManager from "@/components/UserManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="h-full overflow-y-auto bg-[#e7f1ee]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#21322f]">Usuarios</h1>
          <p className="mt-0.5 text-[#6f827b]">Gestiona quién puede acceder a Prospecta.</p>
        </header>
        <UserManager currentUserId={session.user.id} />
      </div>
    </div>
  );
}
