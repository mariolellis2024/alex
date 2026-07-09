import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
        <p className="mt-2 text-gray-600">
          Bem-vindo ao sistema de vendas via WhatsApp! Fase 0 concluída com sucesso.
        </p>
      </div>
    </div>
  );
}
