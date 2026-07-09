import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SetupWizard from "./setup-wizard";
import LoginForm from "./login-form";

export default async function AdminPage() {
  const userCount = await prisma.user.count();
  const isFirstRun = userCount === 0;

  if (!isFirstRun) {
    const session = await getSession();
    if (session) {
      redirect("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isFirstRun ? "Bem-vindo ao Sistema" : "Acesso Restrito"}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              {isFirstRun
                ? "Configure a conta do administrador principal para iniciar."
                : "Insira suas credenciais para acessar o painel."}
            </p>
          </div>
          {isFirstRun ? <SetupWizard /> : <LoginForm />}
        </div>
      </div>
    </div>
  );
}
