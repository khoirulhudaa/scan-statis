import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const handleUnauthorized = () => {
  localStorage.clear();
  window.location.href = '/';
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          handleUnauthorized(); // 🚀 langsung redirect
          return false; // ❌ stop retry
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          handleUnauthorized(); // 🚀 langsung redirect
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);