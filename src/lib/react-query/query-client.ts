"use client";

import { QueryClient } from "@tanstack/react-query";

let browserClient: QueryClient | undefined;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dados ficam "frescos" por 1 min — dentro desse periodo nao ha refetch
        // ao montar/refocar, entao navegar e voltar mostra o cache instantaneamente.
        staleTime: 60_000,
        // Cache mantido por 10 min apos o componente desmontar (garbage collection).
        gcTime: 10 * 60_000,
        // Evita rajadas de refetch ao trocar de aba/janela.
        refetchOnWindowFocus: false,
        // 1 retentativa em caso de erro de rede.
        retry: 1,
      },
    },
  });
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    // No servidor sempre criamos um cliente novo (sem cache compartilhado entre requests).
    return makeClient();
  }

  if (!browserClient) browserClient = makeClient();
  return browserClient;
}
