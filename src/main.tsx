import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { testFetchSingleHour } from "./lib/windborne";
import { WINDBORNE_BASE } from "./lib/constants";

// Expose test function globally for debugging
(window as any).testFetchSingleHour = testFetchSingleHour;

// Add a simple API test function
(window as any).testAPI = async () => {
  try {
    await fetch(`${WINDBORNE_BASE}/00.json`);
  } catch (error) {
    console.error('API test error:', error);
  }
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
