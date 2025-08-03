import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BottomNavigationContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  hide: () => void;
  show: () => void;
}

const BottomNavigationContext = createContext<BottomNavigationContextType | undefined>(undefined);

/**
 * Провайдер для управління видимістю нижньої навігації
 */
export const BottomNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true);

  const hide = () => setIsVisible(false);
  const show = () => setIsVisible(true);

  return (
    <BottomNavigationContext.Provider value={{ isVisible, setIsVisible, hide, show }}>
      {children}
    </BottomNavigationContext.Provider>
  );
};

/**
 * Hook для роботи з контекстом нижньої навігації
 */
export const useBottomNavigation = () => {
  const context = useContext(BottomNavigationContext);
  if (context === undefined) {
    throw new Error('useBottomNavigation must be used within a BottomNavigationProvider');
  }
  return context;
};