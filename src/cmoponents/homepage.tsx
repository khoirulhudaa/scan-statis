// src/components/HomePage.tsx
import {
    BookOpen,
    GraduationCap,
    Megaphone, Newspaper,
    Search,
    Star,
    User2,
    Users
} from 'lucide-react';
import { useState } from 'react';
import AnnouncementContent from './AnnouncementContent';
import KelulusanContent from './KelulusanContent';
import NewsContent from './NewsContent';
import OsisContent from './OsisContent';
import TugasContent from './TugasContent';
import UlasanContent from './UlasanContent';

const MENU_ITEMS = [
  { id: 'tugas', label: 'Tugas', icon: BookOpen, color: 'from-blue-600 to-blue-500', badge: '3' },
  { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone, color: 'from-orange-600 to-orange-500', badge: '2' },
  { id: 'berita', label: 'Berita', icon: Newspaper, color: 'from-emerald-600 to-emerald-500', badge: null },
  { id: 'kelulusan', label: 'Kelulusan', icon: GraduationCap, color: 'from-purple-600 to-purple-500', badge: null },
  { id: 'osis', label: 'OSIS', icon: Users, color: 'from-rose-600 to-rose-500', badge: null },
  { id: 'ulasan', label: 'Ulasan', icon: Star, color: 'from-amber-600 to-amber-500', badge: null },
];

interface HomePageProps {
  userProfile: any;
  announcements: any[];
  news: any[];
  tugas: any[];
  osisData: any;
  alumniData: any[];
  comments: any[];
  avgRating: number | null;
  loadingData: { [key: string]: boolean };
  errorData: { [key: string]: string };
  schoolId: number | null;
  token: string | null;
  onCommentAdded: (newComment: any) => void;
  setSelectedAnnouncement: (ann: any) => void;
}

export default function HomePage({
  userProfile,
  announcements,
  news,
  tugas,
  osisData,
  alumniData,
  comments,
  avgRating,
  loadingData,
  errorData,
  schoolId,
  token,
  onCommentAdded,
  setSelectedAnnouncement,
}: HomePageProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMenu = MENU_ITEMS.find(m => m.id === activeMenu);
  const filteredMenuItems = MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleClearSearch = () => setSearchQuery('');

  return (
    <div className="w-full h-full overflow-auto p-4 md:p-6">
      {/* TOP SEARCH BAR */}
      <div className="relative top-0 z-[2] bg-[#020617]/90 border-b border-white/[0.04] pb-4">
        <div className="flex items-center gap-3">
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
              <button onClick={handleClearSearch} className="text-slate-400 hover:text-slate-200 transition-colors">
                <span className="text-xl leading-none">×</span>
              </button>
            )}
          </div>
          <div
            onClick={() => {} /* ganti jika perlu navigasi */}
            className="cursor-pointer active:scale-[0.96] hover:brightness-90 relative w-9 h-9 bg-slate-800/60 border border-white/[0.06] rounded-xl flex items-center justify-center shrink-0"
          >
            <User2 size={15} className="text-slate-300" />
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-5">
        {/* BANNER / PROMO CARD */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-5 shadow-xl shadow-blue-900/30">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-200 mb-1">Selamat Datang 👋</p>
              <h2 className="text-lg w-full truncate font-black leading-tight">
                {userProfile.name || 'Siswa'}
              </h2>
              <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wider font-medium">
                {userProfile.kelas || userProfile.role}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Semester</p>
              <p className="text-2xl font-black leading-none">2</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">2025/2026</p>
            </div>
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
            {/* QUICK_STATS bisa dipindah ke sini jika perlu */}
          </div>
        </div>

        {/* MENU GRID */}
        <div className='w-full'>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4">
            Layanan {searchQuery ? `(${filteredMenuItems.length} ditemukan)` : ''}
          </p>
          {filteredMenuItems.length === 0 && searchQuery ? (
            <div className="w-full text-center py-10 text-slate-500 text-sm">
              Tidak menemukan "{searchQuery}"
              <br />
              <button onClick={handleClearSearch} className="mt-3 text-blue-400 text-xs underline">
                Hapus pencarian
              </button>
            </div>
          ) : (
            <div className="w-full grid grid-cols-4 gap-5">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className="w-full cursor-pointer active:scale-[0.96] hover:brightness-80 flex flex-col items-center gap-2 transition-transform"
                  >
                    <div className={`relative w-full h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon size={22} className="text-white" />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[8px] font-black rounded-full flex items-center justify-center shadow">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 text-center leading-tight">{item.label}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PENGUMUMAN TERBARU */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Pengumuman Terbaru</p>
            <button className="cursor-pointer active:scale-[0.98] hover:brightness-90 text-[9px] text-blue-400 font-bold uppercase tracking-wider">Lihat Semua</button>
          </div>
          <AnnouncementContent 
            items={announcements} 
            loading={loadingData.announcements} 
            error={errorData.announcements} 
            setSelectedAnnouncement={setSelectedAnnouncement}
          />
        </div>
      </div>

      {/* Modal detail pengumuman */}
      {/* ... bisa dipindah ke komponen terpisah jika ingin lebih modular */}

      {/* Modal menu aktif */}
      {activeMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setActiveMenu(null)} />
          <div className="relative w-full max-w-lg bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-black text-center mb-1">{selectedMenu?.label || 'Fitur'}</h3>
            <p className="text-xs text-slate-400 text-center mb-6">{loadingData[activeMenu!] ? 'Memuat...' : ''}</p>
            <div className="max-h-[60vh] overflow-y-auto px-1">
              {activeMenu === 'pengumuman' && <AnnouncementContent items={announcements} loading={loadingData.announcements} error={errorData.announcements} setSelectedAnnouncement={setSelectedAnnouncement} />}
              {activeMenu === 'berita' && <NewsContent items={news} loading={loadingData.news} error={errorData.news} />}
              {activeMenu === 'tugas' && <TugasContent items={tugas} loading={loadingData.tugas} error={errorData.tugas} />}
              {activeMenu === 'kelulusan' && <KelulusanContent items={alumniData} loading={loadingData.kelulusan} error={errorData.kelulusan} />}
              {activeMenu === 'osis' && <OsisContent data={osisData} loading={loadingData.osis} error={errorData.osis} />}
              {activeMenu === 'ulasan' && (
                <UlasanContent
                  comments={comments}
                  avgRating={avgRating}
                  loading={loadingData.ulasan}
                  error={errorData.ulasan}
                  schoolId={schoolId}
                  token={token}
                  onCommentAdded={onCommentAdded}
                />
              )}
            </div>
            <button
              onClick={() => setActiveMenu(null)}
              className="mt-6 w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-black uppercase tracking-widest transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}