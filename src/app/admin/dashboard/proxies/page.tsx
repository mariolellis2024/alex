import { getProxies } from "@/app/actions/proxies";
import ProxyForm from "./proxy-form";
import { DeleteButton } from "./proxy-list";

export default async function ProxiesPage() {
  const proxies = await getProxies();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerenciamento de Proxies</h1>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-8 text-sm leading-relaxed border border-blue-100">
        <p className="font-semibold mb-1">Por que usar proxies?</p>
        <p>
          O WhatsApp monitora IPs de servidores que enviam mensagens em grande volume. Para proteger seus números de banimentos, recomendamos fortemente a utilização de proxies dedicados (residenciais ou móveis). O sistema atribuirá um proxy fixo para cada número conectado.
        </p>
      </div>

      <ProxyForm />

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Proxies Cadastrados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host/Porta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autenticação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proxies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Nenhum proxy cadastrado ainda.
                  </td>
                </tr>
              ) : (
                proxies.map((proxy) => (
                  <tr key={proxy.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {proxy.host}:{proxy.port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                      {proxy.protocol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proxy.username ? (
                        <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded">Sim</span>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs bg-gray-50 px-2 py-1 rounded">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        proxy.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {proxy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DeleteButton id={proxy.id} />
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
