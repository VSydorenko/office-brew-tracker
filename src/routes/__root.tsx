import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/ui/auth-provider";
import { BottomNavigationProvider } from "@/contexts/BottomNavigationContext";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { OfflineSync } from "@/components/ui/offline-sync";
import { reportLovableError } from "@/lib/lovable-error-reporting";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
      { title: "Office Brew Tracker" },
      { name: "description", content: "Трекер споживання кави в офісі" },
      { name: "author", content: "Lovable" },
      { name: "theme-color", content: "#8B4513" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "BrewTracker" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "Office Brew Tracker" },
      { property: "og:description", content: "Трекер споживання кави в офісі" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@lovable_dev" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/icon-192x192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192x192.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: RootErrorComponent,
});

/**
 * Оболонка документа: рендерить html/head/body для SSR.
 */
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Кореневий компонент застосунку: провайдери та спільний каркас сторінок.
 */
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BottomNavigationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <OfflineSync />
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1 pb-16 md:pb-0">
                <Outlet />
              </main>
              <BottomNavigation />
              <PWAInstallPrompt />
            </div>
          </TooltipProvider>
        </BottomNavigationProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

/**
 * Сторінка 404 для неіснуючих маршрутів.
 */
function NotFoundComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-brew">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Такої сторінки не існує</p>
        <a href="/" className="text-primary underline underline-offset-4">
          Повернутися на головну
        </a>
      </div>
    </div>
  );
}

/**
 * Запасний екран для помилок рендерингу React-дерева.
 */
function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  console.error(error);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="text-muted-foreground">
          Щось пішло не так. Спробуйте ще раз або поверніться на головну.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Спробувати ще раз
          </button>
          <a className="px-4 py-2 rounded-md border border-border" href="/">
            На головну
          </a>
        </div>
      </div>
    </div>
  );
}