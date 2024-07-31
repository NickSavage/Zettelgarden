import React, { createContext, ReactNode, useContext, useState } from "react";

interface ChildrenProviderProps {
  children: ReactNode;
}

interface ShortcutProviderType {
  showCreateTaskWindow: boolean;
  setShowCreateTaskWindow: (show: boolean) => void;
  showQuickSearchWindow: boolean;
  setShowQuickSearchWindow: (show: boolean) => void;
}

const ShortcutContext = createContext<ShortcutProviderType>({
  showCreateTaskWindow: false,
  setShowCreateTaskWindow: () => {},
  showQuickSearchWindow: false,
  setShowQuickSearchWindow: () => {},
});

export const ShortcutProvider = ({ children }: ChildrenProviderProps) => {
  const [showCreateTaskWindow, setShowCreateTaskWindow] = useState(false);
  const [showQuickSearchWindow, setShowQuickSearchWindow] = useState(false);

  return (
    <ShortcutContext.Provider
      value={{
        showCreateTaskWindow,
        setShowCreateTaskWindow,
        showQuickSearchWindow,
        setShowQuickSearchWindow,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcutContext = () => {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error("useShortcutContext must be used within a ShorcutProvider");
  }
  return context;
};
