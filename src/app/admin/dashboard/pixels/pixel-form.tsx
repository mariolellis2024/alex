"use client";

import { useRef, useState } from "react";
import { createPixel } from "@/app/actions/pixels";

export default function PixelForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createPixel(formData);
      ref.current?.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Adicionar Novo Pixel</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Identificação</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Produto A"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID do Pixel (Meta)</label>
          <input
            name="pixelId"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 1234567890"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token de Acesso (CAPI)</label>
          <input
            name="capiToken"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Token gerado no Gerenciador de Eventos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de Teste (Opcional)</label>
          <input
            name="testEventCode"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: TEST12345"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-70"
        >
          {loading ? "Salvando..." : "Salvar Pixel"}
        </button>
      </div>
    </form>
  );
}
