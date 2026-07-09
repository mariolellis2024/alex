import { getTrackingLinks } from "@/app/actions/tracking-links";
import { getPixels } from "@/app/actions/pixels";
import TrackingLinkForm from "./link-form";
import { DeleteLinkButton } from "./link-list";

export default async function TrackingLinksPage() {
  const links = await getTrackingLinks();
  const pixels = await getPixels();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Links de Rastreio</h1>
      
      <TrackingLinkForm pixels={pixels} />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Links Cadastrados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pixel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliques Únicos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Nenhum link cadastrado.
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-blue-600">/r/{link.code}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-xs" title={link.initialMessage}>
                        "{link.initialMessage}"
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link.pixel ? link.pixel.name : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {link._count.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DeleteLinkButton id={link.id} />
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
