// src/components/home/LatestAnnouncements.tsx
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Megaphone } from 'lucide-react';

interface Announcement {
  id: string | number;
  title: string;
  content: string;
  category?: string;
  publishDate: string;
}

interface LatestAnnouncementsProps {
  announcements: Announcement[];
  loading: boolean;
  error?: any;
  onSelectAnnouncement: (ann: Announcement) => void;
}

export default function LatestAnnouncements({
  announcements,
  loading,
  error,
  onSelectAnnouncement,
}: LatestAnnouncementsProps) {
  if (loading) {
    return <div className="text-center py-8 text-slate-500 text-xs">Memuat pengumuman...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400 text-xs">{error}</div>;
  }

  if (announcements.length === 0) {
    return <div className="text-center py-8 text-slate-600 text-xs">Belum ada pengumuman</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
          Pengumuman Terbaru
        </p>
        <button className="cursor-pointer active:scale-[0.98] hover:brightness-90 text-[9px] text-blue-400 font-bold uppercase tracking-wider">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-2.5">
        {announcements.slice(0, 3).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectAnnouncement(item)}
            className="cursor-pointer active:scale-[0.97] hover:brightness-85 flex items-start gap-3 bg-slate-900/80 border border-white/[0.05] rounded-2xl p-3.5"
          >
            <div className="mt-0.5 w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/20">
              <Megaphone size={15} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] w-full font-bold leading-tight truncate">{item.title}</p>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 w-[97%] truncate">
                {item.content}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[8px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                  {item.category || 'Umum'}
                </span>
                <span className="text-[8px] text-slate-500">
                  {format(new Date(item.publishDate), 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}