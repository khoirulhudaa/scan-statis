// Di App.tsx atau main.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './loginPage';
import ScannerPage from './scannerPage';
import './App.css'


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

