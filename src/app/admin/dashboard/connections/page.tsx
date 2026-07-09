import { getConnections } from "@/app/actions/connections";
import { getProxies } from "@/app/actions/proxies";
import ConnectionForm from "./connection-form";
import { ConnectionActions } from "./connection-list";

export default async function ConnectionsPage() {
  const connections = await getConnections();
  const proxies = await getProxies();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conexões de WhatsApp</h1>
      
      <ConnectionForm proxies={proxies} />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Números Conectados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / Instância</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy Vinculado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Nenhuma conexão de WhatsApp configurada.
                  </td>
                </tr>
              ) : (
                connections.map((conn) => (
                  <tr key={conn.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{conn.internalName}</div>
                      <div className="text-xs text-gray-500">{conn.instanceName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {conn.number || "Aguardando Pareamento"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {conn.proxy ? `${conn.proxy.host}:${conn.proxy.port}` : <span className="text-red-500 font-medium">Sem Proxy</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        conn.status === 'CONNECTED' ? 'bg-green-100 text-green-800' :
                        conn.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {conn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <ConnectionActions id={conn.id} status={conn.status} />
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
