"use client";

import { deleteProxy } from "@/app/actions/proxies";
import { useTransition } from "react";

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => deleteProxy(id))}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
