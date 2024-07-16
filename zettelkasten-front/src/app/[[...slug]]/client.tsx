"use client";

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "src/contexts/AuthContext";
import dynamic from "next/dynamic";

const App = dynamic(() => import("../../App"), { ssr: false });

export function ClientOnly() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
