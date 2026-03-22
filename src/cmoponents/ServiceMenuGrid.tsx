// src/components/home/ServiceMenuGrid.tsx
import { toast } from 'sonner';

interface ServiceMenuGridProps {
  filteredMenuItems?: any[];
  loadingData: Record<string, boolean>;
  searchQuery: string;
  handleClearSearch: () => void;
  onMenuClick: (itemId: string) => void;
  token?: string;
  setShowLoginQrScanner: (show: boolean) => void;
  setLoginQrStatus: (status: any) => void;
  setScannerActive: (active: boolean) => void;
  setLoginQrMessage: (msg: string) => void;
}

export default function ServiceMenuGrid({
  filteredMenuItems,
  loadingData,
  searchQuery,
  handleClearSearch,
  onMenuClick,
  token,
  setShowLoginQrScanner,
  setLoginQrStatus,
  setScannerActive,
  setLoginQrMessage,
}: ServiceMenuGridProps) {
  return (
    <div className="w-full">
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4">
        Layanan {searchQuery ? `(${filteredMenuItems?.length} ditemukan)` : ''}
      </p>

      {filteredMenuItems?.length === 0 && searchQuery ? (
        <div className="w-full text-center py-10 text-slate-500 text-sm">
          Tidak menemukan "{searchQuery}"
          <br />
          <button
            onClick={handleClearSearch}
            className="mt-3 text-blue-400 text-xs underline"
          >
            Hapus pencarian
          </button>
        </div>
      ) : (
        <div className="w-full grid grid-cols-4 gap-5">
          {filteredMenuItems?.map((item) => {
            const Icon = item.icon;
            const isLoading = loadingData[item.id];

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'login-qr') {
                    if (!token) {
                      toast.error('Anda harus login terlebih dahulu');
                      return;
                    }
                    setLoginQrStatus('idle');
                    setScannerActive(false);
                    setLoginQrMessage('');
                    setShowLoginQrScanner(true);
                  } else {
                    onMenuClick(item.id);
                  }
                }}
                disabled={isLoading}
                className={`w-full cursor-pointer active:scale-[0.96] hover:brightness-80 flex flex-col items-center gap-2 transition-transform ${
                  isLoading ? 'opacity-60' : ''
                }`}
              >
                <div
                  className={`relative w-full h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon size={22} className="text-white" />
                  )}

                  {item.badge && !isLoading && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[8px] font-black rounded-full flex items-center justify-center shadow">
                      {item?.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-300 text-center leading-tight">
                  {item.label}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}