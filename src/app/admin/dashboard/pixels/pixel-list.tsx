"use client";

import { deletePixel } from "@/app/actions/pixels";
import { useTransition } from "react";

export function DeletePixelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("Excluir este Pixel?")) {
          startTransition(() => deletePixel(id));
        }
      }}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
    >
      {isPending ? "Excluindo..." : "Excluir"}
    </button>
  );
}
