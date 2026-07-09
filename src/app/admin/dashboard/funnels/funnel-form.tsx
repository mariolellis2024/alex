"use client";

import { useRef, useState } from "react";
import { createFunnel } from "@/app/actions/funnels";
import { useRouter } from "next/navigation";

export default function FunnelForm() {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      const id = await createFunnel(formData);
      ref.current?.reset();
      router.push(`/admin/dashboard/funnels/${id}/editor`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Funil</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Funil</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Funil de Lançamento"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <input
            name="description"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Fluxo com VSL + Quiz"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-70"
        >
          {loading ? "Criando..." : "Criar e Editar Visualmente"}
        </button>
      </div>
    </form>
  );
}
