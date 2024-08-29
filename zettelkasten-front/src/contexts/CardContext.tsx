import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchPartialCards } from "../api/cards";
import { PartialCard } from "../models/Card";

interface PartialCardContextType {
  partialCards: PartialCard[];
  refreshPartialCards: boolean;
  setRefreshPartialCards: (refrsh: boolean) => void;
  getPartialCards: () => Promise<void>;
}
const PartialCardContext = createContext<PartialCardContextType | undefined>(
  undefined,
);

export const PartialCardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [partialCards, setPartialCards] = useState<PartialCard[]>([]);
  const [refreshPartialCards, setRefreshPartialCards] =
    useState<boolean>(false);

  const getPartialCards = async () => {
    console.log("hmm?");
    await fetchPartialCards("", "date").then((data) => {
      setPartialCards(data);
      setRefreshPartialCards(false);
    });
  };

  useEffect(() => {
    if (refreshPartialCards) {
      getPartialCards();
    }
    const intervalId = setInterval(() => {
      getPartialCards();
    }, 60000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [refreshPartialCards]);

  return (
    <PartialCardContext.Provider
      value={{
        partialCards,
        refreshPartialCards,
        setRefreshPartialCards,
        getPartialCards,
      }}
    >
      {children}
    </PartialCardContext.Provider>
  );
};

export const usePartialCardContext = () => {
  const context = useContext(PartialCardContext);
  if (context === undefined) {
    throw new Error(
      "usePartialCardContext must be used wtihin a PartialCardProvider",
    );
  }
  return context;
};
