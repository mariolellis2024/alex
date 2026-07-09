"use client";

import { useRef, useState } from "react";
import { createConnection } from "@/app/actions/connections";

export default function ConnectionForm({ proxies }: { proxies: any[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createConnection(formData);
      ref.current?.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Adicionar Nova Conexão</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Identificação</label>
          <input
            name="internalName"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Chip Principal Vendas"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vincular Proxy (Recomendado)</label>
          <select
            name="proxyId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Sem Proxy (Risco de Banimento Alto)</option>
            {proxies.map(p => (
              <option key={p.id} value={p.id}>
                {p.host}:{p.port} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-70 font-medium"
        >
          {loading ? "Criando Instância..." : "Criar Conexão"}
        </button>
      </div>
    </form>
  );
}
