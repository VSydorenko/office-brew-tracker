import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/ui/auth-provider";
import { BottomNavigationProvider } from "@/contexts/BottomNavigationContext";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Purchases from "./pages/Purchases";
import CoffeeCatalog from "./pages/CoffeeCatalog";
import CoffeeDetail from "./pages/CoffeeDetail";
import Consumption from "./pages/Consumption";
import MyPayments from "./pages/MyPayments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BottomNavigationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1 pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/coffee-catalog" element={<CoffeeCatalog />} />
                  <Route path="/coffee-catalog/:id" element={<CoffeeDetail />} />
                  <Route path="/consumption" element={<Consumption />} />
                  <Route path="/my-payments" element={<MyPayments />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <BottomNavigation />
              <PWAInstallPrompt />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </BottomNavigationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
