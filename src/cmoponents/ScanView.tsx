// src/components/scanner/ScanView.tsx
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';

interface ScanViewProps {
  status: any;
}

export default function ScanView({ status }: ScanViewProps) {

  // Mengambil nama dari localStorage user_profile
  const studentName = useMemo(() => {
    try {
      const profile = localStorage.getItem('user_profile');
      if (profile) {
        const parsed = JSON.parse(profile);
        return parsed.name;
      }
    } catch (error) {
      console.error("Gagal mengambil data profil:", error);
    }
    return null;
  }, []);

  return (
    <div className="flex-1 flex h-full overflow-hidden items-center justify-center p-0 z-10 relative">
      <div className="relative w-full h-full">
        {/* Scanner Brackets */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] z-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl" />
          <div className="w-full h-[1px] bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]" />
        </div>

        <div id="reader" className="w-full h-full bg-black" />

        {status && (
          <div
            className={`absolute h-screen inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 ${
              status?.type === 'success' ? 'bg-blue-500' : 'bg-slate-900/95'
            }`}
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/10">
              {status?.type === 'loading' ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-4xl text-white">
                  {status.type === 'success' ? <CheckCircle size={60} /> : <AlertCircle size={60} />}
                </span>
              )}
            </div>
            {status?.type === 'success' && studentName && (
              <h2 className="text-white text-md font-black mb-2 uppercase tracking-tight">
                {studentName}
              </h2>
            )}

            <p className={`font-bold uppercase tracking-[0.2em] text-sm ${status.type === 'success' ? 'text-blue-100' : 'text-red-400'} mb-8`}>
              {status.msg}
            </p>
            {status.type !== 'loading' && (
              <button
                onClick={() => window.location.reload()}
                className="cursor-pointer active:scale-[0.97] hover:brightness-80 bg-white text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
              >
                Kembali
              </button>
            )}
          </div>
        )}

        <div className="absolute top-12 left-0 right-0 text-center z-20 pointer-events-none">
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Active</p>
        </div>
      </div>
    </div>
  );
}