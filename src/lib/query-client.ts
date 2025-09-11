/**
 * Конфігурація React Query (TanStack Query) для додатку
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Створює та налаштовує QueryClient з оптимізованими налаштуваннями для Supabase
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Кеш залишається свіжим 5 хвилин
        staleTime: 5 * 60 * 1000,
        // Кеш зберігається 30 хвилин
        gcTime: 30 * 60 * 1000,
        // Повторювати запити у випадку помилки
        retry: (failureCount, error: any) => {
          // Не повторювати для 404 або авторизаційних помилок
          if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
            return false;
          }
          // Максимум 3 спроби
          return failureCount < 3;
        },
        // Затримка між спробами
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Рефетчити при фокусуванні вікна
        refetchOnWindowFocus: true,
        // Рефетчити при відновленні з'єднання
        refetchOnReconnect: true,
      },
      mutations: {
        // Повторювати мутації тільки для мережевих помилок
        retry: (failureCount, error: any) => {
          if (error?.message?.includes('NetworkError') || error?.code === 'NETWORK_ERROR') {
            return failureCount < 2;
          }
          return false;
        },
      },
    },
  });
};

/**
 * Ключі для React Query запитів - централізоване керування
 */
export const queryKeys = {
  // Профілі користувачів
  profiles: {
    all: ['profiles'] as const,
    picker: (search?: string) => ['profiles', 'picker', search] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
  },
  // Типи кави
  coffeeTypes: {
    all: ['coffee-types'] as const,
    detail: (id: string) => ['coffee-types', 'detail', id] as const,
    search: (query: string) => ['coffee-types', 'search', query] as const,
  },
  // Покупки
  purchases: {
    all: ['purchases'] as const,
    detail: (id: string) => ['purchases', 'detail', id] as const,
    recent: (limit: number) => ['purchases', 'recent', limit] as const,
    latestPrice: (coffeeId: string) => ['purchases', 'latest-price', coffeeId] as const,
    canDelete: (purchaseId: string) => ['purchases', 'can-delete', purchaseId] as const,
    lastTemplate: (buyerId: string) => ['purchases', 'last-template', buyerId] as const,
  },
  // Розподіли покупок
  distributions: {
    all: ['distributions'] as const,
    byPurchase: (purchaseId: string) => ['distributions', 'purchase', purchaseId] as const,
    myPayments: ['distributions', 'my-payments'] as const,
  },
  // Шаблони розподілу
  distributionTemplates: {
    all: ['distribution-templates'] as const,
    detail: (id: string) => ['distribution-templates', 'detail', id] as const,
    active: ['distribution-templates', 'active'] as const,
  },
  // Dashboard KPI
  dashboard: {
    kpis: (startDate?: string, endDate?: string) => 
      ['dashboard', 'kpis', startDate, endDate] as const,
    spending: (startDate?: string, endDate?: string) => 
      ['dashboard', 'spending', startDate, endDate] as const,
    topCoffees: (startDate?: string, endDate?: string) => 
      ['dashboard', 'top-coffees', startDate, endDate] as const,
    topDrivers: (startDate?: string, endDate?: string) => 
      ['dashboard', 'top-drivers', startDate, endDate] as const,
    recentPurchases: (limit: number) => 
      ['dashboard', 'recent-purchases', limit] as const,
    statusBreakdown: (startDate?: string, endDate?: string) => 
      ['dashboard', 'status-breakdown', startDate, endDate] as const,
  },
  // Довідкові дані
  reference: {
    brands: ['reference', 'brands'] as const,
    flavors: ['reference', 'flavors'] as const,
    origins: ['reference', 'origins'] as const,
    varieties: ['reference', 'varieties'] as const,
    processingMethods: ['reference', 'processing-methods'] as const,
  },
} as const;