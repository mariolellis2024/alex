import { getPixels } from "@/app/actions/pixels";
import PixelForm from "./pixel-form";
import { DeletePixelButton } from "./pixel-list";

export default async function PixelsPage() {
  const pixels = await getPixels();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pixels e API de Conversões</h1>
      
      <PixelForm />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Pixels Cadastrados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pixel ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Event Code</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pixels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Nenhum pixel cadastrado.
                  </td>
                </tr>
              ) : (
                pixels.map((pixel) => (
                  <tr key={pixel.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{pixel.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pixel.pixelId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pixel.testEventCode || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DeletePixelButton id={pixel.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
