// src/components/scanner/HistoryView.tsx
import { ListX } from 'lucide-react';

interface HistoryViewProps {
  history: any[];
  loadingHistory: boolean;
}

export default function HistoryView({ history, loadingHistory }: HistoryViewProps) {
  return (
    <div
      className={`w-full h-full flex mx-auto justify-start items-center flex-col p-4 md:p-6 z-10 ${
        history.length > 1 ? 'overflow-y-auto' : 'overflow-hidden'
      }`}
    >
      {loadingHistory ? (
        <div className="flex justify-center p-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col gap-3">
          {history.length > 0 ? (
            history.map((item, i) => (
              <div
                key={i}
                className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{item.date}</p>
                  <p className="text-xs font-bold mt-1">{item.time} WIB</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                      item.isLate ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {item.isLate ? 'Terlambat' : item.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col pb-20 justify-center items-center text-center h-full">
              <ListX className="text-slate-300 mb-10" size={28} />
              <p className="text-center text-slate-500 text-md">Belum ada data kehadiran bulan ini</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}