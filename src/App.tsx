// Di App.tsx atau main.tsx
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import LoginPage from './loginPage';
import ScannerPage from './scannerPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

