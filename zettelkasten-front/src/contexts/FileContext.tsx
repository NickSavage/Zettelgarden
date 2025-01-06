import React, { createContext, useState, useContext } from "react";

interface FileContextType {
  refreshFiles: boolean;
  setRefreshFiles: (refresh: boolean) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: React.ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [refreshFiles, setRefreshFiles] = useState(false);

  return (
    <FileContext.Provider
      value={{
        refreshFiles,
        setRefreshFiles,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
}; 