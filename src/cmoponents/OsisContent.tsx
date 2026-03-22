// src/components/OsisContent.tsx
interface OsisContentProps {
  data: any;
  loading: boolean;
  error: string;
}

export default function OsisContent({ data, loading, error }: OsisContentProps) {
  if (loading) return <div className="text-center py-10 text-slate-400">Memuat struktur OSIS...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{error}</div>;
  if (!data) return <div className="text-slate-500 text-center py-10">Data OSIS belum tersedia</div>;

  return (
    <div className="space-y-7">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-blue-400">Periode {data.periodeSaatIni || '2025/2026'}</p>
        <p className="text-xl font-black mt-1">Pengurus OSIS</p>
      </div>
        {/* Pengurus */}
        <div className="grid grid-cols-2 gap-4">
            {[
            { title: 'Ketua', name: data.ketuaNama, nip: data.ketuaNipNuptk, photo: data.ketuaFotoUrl },
            { title: 'Wakil', name: data.wakilNama, nip: data.wakilNipNuptk, photo: data.wakilFotoUrl },
            { title: 'Sekretaris', name: data.sekretarisNama, nip: data.sekretarisNipNuptk, photo: data.sekretarisFotoUrl },
            { title: 'Bendahara', name: data.bendaharaNama, nip: data.bendaharaNipNuptk, photo: data.bendaharaFotoUrl },
            ].map((p, i) => (
            <div key={i} className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-blue-500/30 mb-3">
                <img
                    src={p.photo || 'https://via.placeholder.com/150'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                />
                </div>
                <p className="font-bold text-sm">{p.title}</p>
                <p className="text-xs text-slate-300 mt-1">{p.name}</p>
                {p.nip && <p className="text-[10px] text-slate-500">{p.nip}</p>}
            </div>
            ))}
        </div>

        {/* Visi & Misi */}
        <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5">
            <p className="uppercase text-xs tracking-widest text-amber-400 mb-2">VISI</p>
            <p className="text-sm leading-relaxed text-slate-200">{data.visi || 'Visi belum diisi'}</p>

            <div className="h-px bg-white/10 my-5" />

            <p className="uppercase text-xs tracking-widest text-amber-400 mb-2">MISI</p>
            <ul className="text-sm text-slate-300 space-y-2">
            {(data.misi || []).map((m: string, i: number) => (
                <li key={i} className="flex gap-2">
                <span className="text-emerald-400">•</span> {m}
                </li>
            ))}
            {(data.misi || []).length === 0 && <li className="text-slate-500">Misi belum diisi</li>}
            </ul>
        </div>

        {/* Prestasi */}
        {data.prestasiSaatIni?.length > 0 && (
            <div>
            <p className="uppercase text-xs tracking-widest text-rose-400 mb-3">PRESTASI TERBARU</p>
            <div className="space-y-3">
                {data.prestasiSaatIni.map((prestasi: any, index: number) => (
                <div 
                    key={index} // atau key={prestasi.id} kalau ada field id
                    className="bg-slate-800/50 border-l-4 border-rose-500 pl-4 py-4 rounded-r-lg text-sm"
                >
                    <p className="font-semibold text-white">{prestasi.judul}</p>
                    <p className="text-xs text-rose-300 mt-1">Tahun {prestasi.tahun}</p>
                    {prestasi.deskripsi && (
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {prestasi.deskripsi}
                    </p>
                    )}
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}