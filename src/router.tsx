import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Створює роутер застосунку разом із налаштованим QueryClient.
 * Налаштування QueryClient перенесені з попереднього src/lib/query-client.ts.
 */
export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Кеш залишається свіжим 5 хвилин
        staleTime: 5 * 60 * 1000,
        // Кеш зберігається 30 хвилин
        gcTime: 30 * 60 * 1000,
        // Повторювати запити у випадку помилки
        retry: (failureCount, error: unknown) => {
          const status = (error as { status?: number } | null)?.status;
          if (status === 404 || status === 401 || status === 403) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Вимкнено автоматичний рефетч при фокусі — це спричиняло втрату даних форм
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error: unknown) => {
          const err = error as { message?: string; code?: string } | null;
          if (err?.message?.includes("NetworkError") || err?.code === "NETWORK_ERROR") {
            return failureCount < 2;
          }
          return false;
        },
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
