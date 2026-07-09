"use client";

import { useState } from "react";
import { fetchQrCode, removeConnection } from "@/app/actions/connections";

export function ConnectionActions({ id, status }: { id: string, status: string }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function handleShowQr() {
    setLoadingQr(true);
    try {
      const data = await fetchQrCode(id);
      if (data.status === "QR" && data.base64) {
        setQrCode(data.base64);
      } else if (data.status === "CONNECTED") {
        alert("Esta conexão já está pareada!");
      } else {
        alert("Não foi possível gerar o QR Code. A instância pode estar off-line.");
      }
    } catch (e) {
      alert("Erro ao buscar QR Code");
    }
    setLoadingQr(false);
  }

  async function handleDelete() {
    if (confirm("Tem certeza que deseja excluir esta conexão?")) {
      setLoadingDelete(true);
      await removeConnection(id);
      setLoadingDelete(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {status !== "CONNECTED" && (
          <button
            onClick={handleShowQr}
            disabled={loadingQr}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            {loadingQr ? "Gerando..." : "QR Code"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loadingDelete}
          className="text-red-600 hover:text-red-900 text-sm font-medium"
        >
          {loadingDelete ? "Excluindo..." : "Excluir"}
        </button>
      </div>
      
      {qrCode && (
        <div className="mt-2 p-2 bg-white border border-gray-200 rounded shadow-lg absolute right-8 z-10 w-64 text-center">
          <p className="text-xs text-gray-500 mb-2">Escaneie com o WhatsApp</p>
          <img src={qrCode} alt="QR Code" className="w-full h-auto" />
          <button 
            onClick={() => setQrCode(null)} 
            className="mt-2 text-xs text-red-500"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
