import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./hooks/useQueryClient";
import { testFetchSingleHour } from "./lib/windborne";

// Expose test function globally for debugging
(window as any).testFetchSingleHour = testFetchSingleHour;

// Add a simple API test function
(window as any).testAPI = async () => {
  console.log('Testing API endpoints...');
  try {
    const response = await fetch('/api/windborne/00.json');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    if (response.ok) {
      const data = await response.json();
      console.log('Data received:', data);
    } else {
      console.log('Response text:', await response.text());
    }
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
