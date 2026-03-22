// src/components/TugasContent.tsx
interface TugasContentProps {
  items: any[];
  loading: boolean;
  error: string;
}

export default function TugasContent({ items, loading, error }: TugasContentProps) {
  if (loading) return <div className="text-center py-10">Memuat tugas...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
  if (!items?.length) return <div className="text-slate-500 text-center py-10">Belum ada tugas</div>;

  return (
    <div className="space-y-4">
      {items.map((t: any) => (
        <div key={t.id} className="bg-slate-800/60 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-sm">{t.judul}</h4>
            <span className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
              {t.jenisSoal}
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3">{t.deskripsi || t.mataPelajaran}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div>Guru: {t.namaGuru}</div>
            <div>Kelas: {t.kelas}</div>
            <div>Mapel: {t.mapel}</div>
            <div>Deadline: {t.deadlineJam ? `${t.tanggal} ${t.deadlineJam}` : t.tanggal}</div>
          </div>
        </div>
      ))}
    </div>
  );
}