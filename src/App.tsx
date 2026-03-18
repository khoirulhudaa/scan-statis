// Di App.tsx atau main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './loginPage';
import ScannerPage from './scannerPage';
import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Opsional: agar tidak re-fetch setiap pindah tab browser
      retry: 1,
    },
  },
});


export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

