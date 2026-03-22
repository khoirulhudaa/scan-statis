// src/components/home/HomeHeader.tsx
import { Search, User2 } from 'lucide-react';
import type { SetStateAction } from 'react';

interface HomeHeaderProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<SetStateAction<string>>;
  handleClearSearch: () => void;
  onProfileClick: () => void;
}

export default function HomeHeader({
  searchQuery,
  setSearchQuery,
  handleClearSearch,
  onProfileClick,
}: HomeHeaderProps) {
  return (
    <div className="relative top-0 z-[2] bg-[#020617]/90 border-b border-white/[0.04] pb-4">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative flex items-center bg-slate-800/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 gap-2">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu yang anda ingin..."
            className="bg-transparent flex-1 outline-none text-xs text-white placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          )}
        </div>

        {/* Profile Icon */}
        <div
          onClick={onProfileClick}
          className="cursor-pointer active:scale-[0.96] hover:brightness-90 relative w-9 h-9 bg-slate-800/60 border border-white/[0.06] rounded-xl flex items-center justify-center shrink-0"
        >
          <User2 size={15} className="text-slate-300" />
        </div>
      </div>
    </div>
  );
}