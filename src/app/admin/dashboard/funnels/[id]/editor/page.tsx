import { getFunnelVersion } from "@/app/actions/funnels";
import EditorClient from "./editor-client";
import { prisma } from "@/lib/prisma";

export default async function FunnelEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const funnel = await prisma.funnel.findUnique({
    where: { id },
  });

  if (!funnel) {
    return <div>Funil não encontrado</div>;
  }

  const version = await getFunnelVersion(id);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{funnel.name}</h1>
          <p className="text-sm text-gray-500">Editando Versão {version?.version || 1}</p>
        </div>
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[700px]">
        <EditorClient 
          funnelId={id} 
          initialNodes={version?.nodes || []} 
          initialEdges={version?.edges || []} 
        />
      </div>
    </div>
  );
}
