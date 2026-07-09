"use client";

import { useRef, useState } from "react";
import { createProxy } from "@/app/actions/proxies";

export default function ProxyForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createProxy(formData);
      ref.current?.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Adicionar Novo Proxy</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Host/IP</label>
          <input
            name="host"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 192.168.1.1 ou proxy.exemplo.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Porta</label>
          <input
            name="port"
            type="number"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="8080"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Protocolo</label>
          <select
            name="protocol"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (Opcional)</label>
          <input
            name="username"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha (Opcional)</label>
          <input
            name="password"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-70"
        >
          {loading ? "Adicionando..." : "Salvar Proxy"}
        </button>
      </div>
    </form>
  );
}
