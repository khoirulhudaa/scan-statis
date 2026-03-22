// src/components/AnnouncementContent.tsx
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

interface AnnouncementContentProps {
  items: any[];
  loading: boolean;
  error: string;
  setSelectedAnnouncement?: (item: any) => void;
}

export default function AnnouncementContent({ items, loading, error, setSelectedAnnouncement }: AnnouncementContentProps) {
  if (loading) return <div className="text-center py-10">Memuat pengumuman...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
  if (!items?.length) return <div className="text-slate-500 text-center py-10">Belum ada pengumuman</div>;

  return (
    <div className="space-y-4">
      {items.map((item: any) => (
        <div
          key={item.id}
          onClick={() => setSelectedAnnouncement?.(item)}
          className="cursor-pointer active:scale-[0.97] hover:brightness-85 bg-slate-800/50 p-4 rounded-xl border border-white/5"
        >
          <h4 className="font-bold text-sm mb-1.5">{item.title}</h4>
          <p className="text-xs text-slate-300 mb-2 line-clamp-3 w-[97%] truncate">{item.content}</p>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{item.category || 'Umum'}</span>
            <span>{format(new Date(item.publishDate), 'dd MMM yyyy', { locale: id })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}