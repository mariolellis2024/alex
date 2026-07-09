"use client";

import { deleteTrackingLink } from "@/app/actions/tracking-links";
import { useTransition } from "react";

export function DeleteLinkButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("Excluir este Link de Rastreio?")) {
          startTransition(() => deleteTrackingLink(id));
        }
      }}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
