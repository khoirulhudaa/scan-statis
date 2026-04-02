// src/components/KelulusanContent.tsx
interface KelulusanContentProps {
  items: any[];
  loading: boolean;
  error: any;
}

export default function KelulusanContent({ items, loading, error }: KelulusanContentProps) {
  if (loading) return <div className="text-center py-10 text-slate-400">Memuat data alumni...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
  if (!items?.length) return <div className="text-slate-500 text-center py-10">Belum ada data kelulusan</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1">DAFTAR ALUMNI</p>
        <p className="text-2xl font-black text-white">Angkatan Terbaru</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map((alumni: any) => (
          <div key={alumni.id} className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 mb-3">
              <img src={alumni.photoUrl || '/default.jpg'} alt={alumni.name} className="w-full h-full object-cover" />
            </div>
            <h5 className="font-bold text-sm leading-tight">{alumni.name}</h5>
            <p className="text-xs text-emerald-400 mt-1">
              {alumni.nis} • Lulus {alumni.graduationYear}
            </p>
            {alumni.batch && <span className="mt-2 text-[10px] bg-slate-700 px-3 py-0.5 rounded-full">{alumni.batch}</span>}
            {alumni.description && <p className="text-[10px] text-slate-400 mt-3 line-clamp-2">{alumni.description}</p>}
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-500">Total alumni aktif: {items.length}</p>
    </div>
  );
}