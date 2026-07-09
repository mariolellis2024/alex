"use client";

import { useRef, useState } from "react";
import { createTrackingLink } from "@/app/actions/tracking-links";

export default function TrackingLinkForm({ pixels }: { pixels: any[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function action(formData: FormData) {
    setLoading(true);
    setError("");
    try {
      await createTrackingLink(formData);
      ref.current?.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={ref} action={action} className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Link de Rastreio</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código do Link</label>
          <div className="flex items-center">
            <span className="text-gray-500 bg-gray-50 border border-r-0 border-gray-300 px-3 py-2 rounded-l-md text-sm">/r/</span>
            <input
              name="code"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-r-md outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: promo-inverno"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pixel Associado (Opcional)</label>
          <select
            name="pixelId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Nenhum</option>
            {pixels.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.pixelId})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem Inicial do Lead</label>
          <input
            name="initialMessage"
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Quero garantir a promoção de inverno!"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Destino Específico (Opcional)</label>
          <input
            name="destinationNumber"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 5511999999999 (Se vazio, faz round-robin)"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-70"
        >
          {loading ? "Criando..." : "Criar Link"}
        </button>
      </div>
    </form>
  );
}
