import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { testFetchSingleHour } from "./lib/windborne";

// Expose test function globally for debugging
(window as any).testFetchSingleHour = testFetchSingleHour;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
