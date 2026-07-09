import { getFunnels } from "@/app/actions/funnels";
import FunnelForm from "./funnel-form";
import Link from "next/link";

export default async function FunnelsPage() {
  const funnels = await getFunnels();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Funis de Vendas (Automação)</h1>
      
      <FunnelForm />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Seus Funis</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Versão Atual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links Associados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {funnels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Nenhum funil cadastrado.
                  </td>
                </tr>
              ) : (
                funnels.map((funnel) => {
                  const lastVersion = funnel.versions[0];
                  return (
                    <tr key={funnel.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{funnel.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{funnel.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        v{lastVersion?.version || 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lastVersion?.isActive ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Rascunho
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {funnel._count.trackingLinks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin/dashboard/funnels/${funnel.id}/editor`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Editor Visual
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
