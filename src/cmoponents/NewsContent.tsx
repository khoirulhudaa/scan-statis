// src/components/NewsContent.tsx
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

interface NewsContentProps {
  items: any[];
  loading: boolean;
  error: string;
}

export default function NewsContent({ items, loading, error }: NewsContentProps) {
  if (loading) return <div className="text-center py-10 text-slate-400">Memuat berita...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
  if (!items?.length) return <div className="text-slate-500 text-center py-10">Belum ada berita</div>;

  return (
    <div className="space-y-5">
      {items.map((item: any) => (
        <div key={item.id} className="bg-slate-800/60 border border-white/5 rounded-2xl overflow-hidden">
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                {item.category || 'Umum'}
              </span>
              <span className="text-[10px] text-slate-500">
                {format(new Date(item.publishDate), 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
            <h4 className="font-bold text-base leading-tight mb-2">{item.title}</h4>
            <p className="text-xs text-slate-300 line-clamp-4">{item.content}</p>
            {item.source && <p className="text-[10px] text-slate-500 mt-3">Sumber: {item.source}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}