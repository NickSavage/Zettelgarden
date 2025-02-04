import React, { createContext, useContext, useState, useCallback } from 'react';

interface CardRefreshContextType {
  refreshCard: (cardId: string) => void;
  setRefreshTrigger: (cardId: string) => void;
  refreshTrigger: string | null;
}

const CardRefreshContext = createContext<CardRefreshContextType>({
  refreshCard: () => {},
  setRefreshTrigger: () => {},
  refreshTrigger: null,
});

export function CardRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTriggerState] = useState<string | null>(null);

  const setRefreshTrigger = useCallback((cardId: string) => {
    setRefreshTriggerState(cardId);
  }, []);

  const refreshCard = useCallback((cardId: string) => {
    // This will be used by components that need to refresh
    setRefreshTriggerState(cardId);
  }, []);

  return (
    <CardRefreshContext.Provider value={{ refreshCard, setRefreshTrigger, refreshTrigger }}>
      {children}
    </CardRefreshContext.Provider>
  );
}

export function useCardRefresh() {
  return useContext(CardRefreshContext);
} 