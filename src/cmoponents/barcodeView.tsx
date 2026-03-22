// src/components/scanner/BarcodeView.tsx
import Barcode from 'react-barcode';
import { Download, Printer } from 'lucide-react';

interface BarcodeViewProps {
  userProfile: any;
  barcodeTab: 'nis' | 'nisn';
  setBarcodeTab: (tab: 'nis' | 'nisn') => void;
  downloadBarcode: () => void;
  printBarcode: () => void;
}

export default function BarcodeView({
  userProfile,
  barcodeTab,
  setBarcodeTab,
  downloadBarcode,
  printBarcode,
}: BarcodeViewProps) {
  const isStudent = userProfile.role === 'siswa';
  const displayValue =
    isStudent
      ? barcodeTab === 'nis'
        ? userProfile.nis
        : userProfile.nisn
      : userProfile.nip;

  const title = isStudent ? `Barcode ${barcodeTab.toUpperCase()}` : 'Barcode NIP';

  return (
    <div className="w-full overflow-hidden p-4 md:p-6 h-full flex flex-col items-center justify-center z-10 relative">
      {isStudent && (
        <div className="w-full grid grid-cols-4 mb-10 bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setBarcodeTab('nis')}
            className={`cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider ${
              barcodeTab === 'nis' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            NIS
          </button>
          <button
            onClick={() => setBarcodeTab('nisn')}
            className={`cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider ${
              barcodeTab === 'nisn' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            NISN
          </button>
          <button
            onClick={downloadBarcode}
            className="cursor-pointer flex justify-center items-center hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            <Download size={19} />
          </button>
          <button
            onClick={printBarcode}
            className="cursor-pointer flex justify-center items-center hover:bg-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            <Printer size={17.5} />
          </button>
        </div>
      )}

      <p className="text-white text-sm uppercase tracking-widest mb-6">{title}</p>

      <div id="barcode-container" className="bg-white w-max rounded-xl">
        <Barcode
          value={displayValue || '00000000'}
          height={100}
          width={3}
          renderer="canvas"
          fontSize={18}
          margin={10}
        />
      </div>
    </div>
  );
}