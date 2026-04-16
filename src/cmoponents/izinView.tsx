import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Paperclip,
  PlusCircle,
  X,
  XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────

type IzinJenis = 'sakit' | 'dispensasi' | 'keluarga';
type IzinStatus = 'pending' | 'approved' | 'rejected';

interface IzinRecord {
  id: number;
  siswaId: number;
  jenis: IzinJenis;
  tanggalMulai: string;
  tanggalAkhir: string;
  deskripsi: string;
  lampiranUrl?: string;
  status: IzinStatus;
  createdAt: string;
}

interface IzinViewProps {
  siswaId: number;
  token: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://be-school.kiraproject.id';

const JENIS_LABELS: Record<IzinJenis, string> = {
  sakit: 'Sakit',
  dispensasi: 'Dispensasi',
  keluarga: 'Keperluan Keluarga',
};

const JENIS_COLORS: Record<IzinJenis, string> = {
  sakit: 'text-red-400 bg-red-500/10 border-red-500/20',
  dispensasi: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  keluarga: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const STATUS_CONFIG: Record<
  IzinStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  approved: {
    label: 'Disetujui',
    icon: CheckCircle2,
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  rejected: {
    label: 'Ditolak',
    icon: XCircle,
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const fetchIzinHistory = async (siswaId: number, token: string): Promise<IzinRecord[]> => {
  const res = await axiosInstance.get(`${BASE_URL}/izin/history/${siswaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.data.success) throw new Error('Gagal mengambil riwayat izin');
  return res.data.data ?? [];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IzinStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${className}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

function JenisBadge({ jenis }: { jenis: IzinJenis }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${JENIS_COLORS[jenis]}`}
    >
      {JENIS_LABELS[jenis]}
    </span>
  );
}

function IzinCard({ item, defaultOpen = false }: { item: IzinRecord; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const mulai = new Date(item.tanggalMulai);
  const akhir = new Date(item.tanggalAkhir);
  const diffDays =
    Math.round((akhir.getTime() - mulai.getTime()) / 86_400_000) + 1;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-800/40 overflow-hidden transition-all duration-200">
      {/* ── Header row ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <JenisBadge jenis={item.jenis} />
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-slate-400 truncate">
            {format(mulai, 'd MMM yyyy', { locale: id })}
            {diffDays > 1 && ` — ${format(akhir, 'd MMM yyyy', { locale: id })}`}
            <span className="ml-1 text-slate-500">({diffDays} hari)</span>
          </p>
        </div>
        {open ? (
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
        )}
      </button>

      {/* ── Detail ── */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05]">
          {item.deskripsi && (
            <p className="text-xs text-slate-300 leading-relaxed mt-3 whitespace-pre-wrap">
              {item.deskripsi}
            </p>
          )}
          {item.lampiranUrl && (
            <a
              href={item.lampiranUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Paperclip size={11} />
              Lihat Lampiran
            </a>
          )}
          <p className="text-[10px] text-slate-600 mt-2">
            Diajukan {format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main: IzinView ───────────────────────────────────────────────────────────

export default function IzinView({ siswaId, token }: IzinViewProps) {
  const queryClient = useQueryClient();

  // ── Tabs: 'form' | 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('history');

  // ── Form state
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    jenis: '' as IzinJenis | '',
    tanggalMulai: today,
    tanggalAkhir: today,
    deskripsi: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Query: riwayat izin
  const {
    data: history = [],
    isLoading: loadingHistory,
    isError: errorHistory,
  } = useQuery({
    queryKey: ['izin-history', siswaId],
    queryFn: () => fetchIzinHistory(siswaId, token),
    enabled: !!siswaId && !!token,
    staleTime: 1000 * 60 * 3,
  });

  // ── Mutation: submit izin
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!form.jenis) throw new Error('Pilih jenis izin terlebih dahulu');
      if (!form.tanggalMulai || !form.tanggalAkhir)
        throw new Error('Tanggal wajib diisi');
      if (form.tanggalAkhir < form.tanggalMulai)
        throw new Error('Tanggal akhir tidak boleh sebelum tanggal mulai');

      const fd = new FormData();
      fd.append('siswaId', String(siswaId));
      fd.append('jenis', form.jenis);
      fd.append('tanggalMulai', form.tanggalMulai);
      fd.append('tanggalAkhir', form.tanggalAkhir);
      fd.append('deskripsi', form.deskripsi.trim());
      if (file) fd.append('lampiran', file);

      const res = await axiosInstance.post(`${BASE_URL}/izin`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (!res.data.success) throw new Error(res.data.message || 'Gagal mengajukan izin');
      return res.data.data;
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setForm({ jenis: '', tanggalMulai: today, tanggalAkhir: today, deskripsi: '' });
      setFile(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['izin-history', siswaId] });
      // Pindah ke history setelah 1.5 detik
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('history');
      }, 1500);
    },
  });

  // ── File handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Helpers
  const inputBase =
    'w-full h-11 px-3 rounded-xl bg-slate-800 border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors';

  const isFormValid =
    !!form.jenis && !!form.tanggalMulai && !!form.tanggalAkhir;

  // ─── Count badges for tabs
  const pendingCount = history.filter((h) => h.status === 'pending').length;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col bg-transparent text-white">
      {/* ── Top bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-4 pb-2">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={13} />
          Riwayat
          {pendingCount > 0 && (
            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            activeTab === 'form'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle size={13} />
          Ajukan Izin
        </button>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 pt-2">

        {/* ════════════ FORM TAB ════════════ */}
        {activeTab === 'form' && (
          <>
            {/* Success flash */}
            {submitSuccess && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-300">
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">Izin berhasil diajukan!</p>
                  <p className="text-xs text-slate-400">Menunggu persetujuan guru / wali kelas.</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {submitMutation.isError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">
                  {(submitMutation.error as Error)?.message || 'Gagal mengajukan izin'}
                </p>
              </div>
            )}

            {/* Jenis izin */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Jenis Izin <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(JENIS_LABELS) as IzinJenis[]).map((jenis) => (
                  <button
                    key={jenis}
                    onClick={() => setForm((f) => ({ ...f, jenis }))}
                    className={`py-3 px-2 rounded-xl text-[11px] font-bold uppercase tracking-wide border transition-all duration-150 active:scale-95 ${
                      form.jenis === jenis
                        ? JENIS_COLORS[jenis] + ' border-current'
                        : 'bg-slate-800/60 text-slate-400 border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    {JENIS_LABELS[jenis]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal mulai & akhir */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Mulai <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggalMulai}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tanggalMulai: e.target.value }))
                  }
                  className={inputBase}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Selesai <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggalAkhir}
                  min={form.tanggalMulai}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tanggalAkhir: e.target.value }))
                  }
                  className={inputBase}
                />
              </div>
            </div>

            {/* Durasi info */}
            {form.tanggalMulai && form.tanggalAkhir && form.tanggalAkhir >= form.tanggalMulai && (
              <p className="text-[11px] text-slate-500 -mt-1 pl-1">
                Durasi:{' '}
                <span className="text-slate-300 font-semibold">
                  {Math.round(
                    (new Date(form.tanggalAkhir).getTime() -
                      new Date(form.tanggalMulai).getTime()) /
                      86_400_000
                  ) + 1}{' '}
                  hari
                </span>
              </p>
            )}

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Keterangan
              </label>
              <textarea
                rows={3}
                placeholder="Ceritakan alasan izin secara singkat..."
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                className={`${inputBase} h-auto py-3 resize-none`}
              />
            </div>

            {/* Lampiran */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Lampiran (opsional)
              </label>

              {!file ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.1] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200"
                >
                  <Paperclip size={16} className="text-slate-500" />
                  <span className="text-[11px] text-slate-500">
                    Tap untuk upload surat / foto (maks. 5 MB)
                  </span>
                </button>
              ) : (
                <div className="relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-white/[0.08]">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 flex-shrink-0">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={removeFile}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Submit button */}
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!isFormValid || submitMutation.isPending}
              className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.97] ${
                isFormValid && !submitMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Mengajukan...
                </span>
              ) : (
                'Ajukan Izin'
              )}
            </button>
          </>
        )}

        {/* ════════════ HISTORY TAB ════════════ */}
        {activeTab === 'history' && (
          <>
            {loadingHistory && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <p className="text-xs text-slate-500">Memuat riwayat izin...</p>
              </div>
            )}

            {!loadingHistory && errorHistory && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">Gagal memuat riwayat. Coba lagi nanti.</p>
              </div>
            )}

            {!loadingHistory && !errorHistory && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                  <FileText size={24} className="text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-400">Belum ada pengajuan izin</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Tap "Ajukan Izin" untuk membuat permohonan baru.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-widest text-white transition active:scale-95"
                >
                  Ajukan Sekarang
                </button>
              </div>
            )}

            {!loadingHistory &&
              !errorHistory &&
              history.length > 0 && (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    {(
                      [
                        ['pending', 'Menunggu'],
                        ['approved', 'Disetujui'],
                        ['rejected', 'Ditolak'],
                      ] as [IzinStatus, string][]
                    ).map(([status, label]) => {
                      const count = history.filter((h) => h.status === status).length;
                      const { className } = STATUS_CONFIG[status];
                      return (
                        <div
                          key={status}
                          className={`rounded-xl border px-3 py-2 text-center ${className}`}
                        >
                          <p className="text-lg font-black">{count}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                            {label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* List */}
                  {history.map((item, i) => (
                    <IzinCard key={item.id} item={item} defaultOpen={i === 0} />
                  ))}
                </>
              )}
          </>
        )}
      </div>
    </div>
  );
}