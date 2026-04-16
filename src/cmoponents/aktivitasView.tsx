import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  Loader2,
  PersonStanding,
  Play,
  Route,
  Timer
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────

type AktivitasTipe = 'lari' | 'jalan' | 'bersepeda' | 'lainnya';

interface GpsPoint {
  lat: number;
  lng: number;
  ts: number;
}

interface AktivitasRecord {
  id: number;
  siswaId: number;
  tipe: string;
  jarakMeter: number;
  durasiDetik: number;
  kalori: number;
  points: GpsPoint[];
  createdAt: string;
}

interface AktivitasViewProps {
  siswaId: number;
  token: string;
  userProfile?: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://be-school.kiraproject.id';

const TIPE_CONFIG: Record<AktivitasTipe, { label: string; icon: React.ElementType; color: string }> = {
  lari:      { label: 'Lari',      icon: PersonStanding, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  jalan:     { label: 'Jalan',     icon: PersonStanding, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  bersepeda: { label: 'Bersepeda', icon: Route,          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  lainnya:   { label: 'Lainnya',   icon: Activity,       color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDurasi = (detik: number) => {
  const h = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const s = detik % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
};

const formatJarak = (meter: number) => {
  if (meter >= 1000) return `${(meter / 1000).toFixed(2)} km`;
  return `${Math.round(meter)} m`;
};

const haversineMeters = (a: GpsPoint, b: GpsPoint) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
};

const totalJarak = (pts: GpsPoint[]) =>
  pts.reduce((acc, p, i) => (i === 0 ? 0 : acc + haversineMeters(pts[i - 1], p)), 0);

const estimasiKalori = (tipe: AktivitasTipe, jarakM: number, durasiDetik: number): number => {
  const menit = durasiDetik / 60;
  console.log(jarakM)
  const met: Record<AktivitasTipe, number> = { lari: 9.8, jalan: 3.5, bersepeda: 7.5, lainnya: 4 };
  return Math.round(met[tipe] * 65 * (menit / 60));
};

// ─── API ─────────────────────────────────────────────────────────────────────

const fetchAktivitasHistory = async (siswaId: number, token: string): Promise<AktivitasRecord[]> => {
  const res = await axiosInstance.get(`${BASE_URL}/aktivitas/history/${siswaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.data.success) throw new Error('Gagal mengambil riwayat aktivitas');
  return res.data.data ?? [];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color}`}>
      <Icon size={13} />
      <div>
        <p className="text-xs font-black leading-none">{value}</p>
        <p className="text-[9px] opacity-60 uppercase tracking-wide leading-none mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function AktivitasCard({ item }: { item: AktivitasRecord }) {
  const [open, setOpen] = useState(false);
  const tipe = (item.tipe?.toLowerCase() as AktivitasTipe) || 'lainnya';
  const cfg = TIPE_CONFIG[tipe] ?? TIPE_CONFIG.lainnya;
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-slate-800/40 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className={`w-9 h-9 flex items-center justify-center rounded-xl border flex-shrink-0 ${cfg.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {format(new Date(item.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-white">{formatJarak(item.jarakMeter)}</p>
          <p className="text-[10px] text-slate-500">{formatDurasi(item.durasiDetik)}</p>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.05]">
          <div className="grid grid-cols-3 gap-2 mt-3">
            <StatPill icon={Route}  value={formatJarak(item.jarakMeter)} label="Jarak"  color="text-blue-400 bg-blue-500/10 border-blue-500/20" />
            <StatPill icon={Timer}  value={formatDurasi(item.durasiDetik)} label="Durasi" color="text-purple-400 bg-purple-500/10 border-purple-500/20" />
            <StatPill icon={Flame}  value={`${item.kalori} kkal`} label="Kalori" color="text-orange-400 bg-orange-500/10 border-orange-500/20" />
          </div>
          {Array.isArray(item.points) && item.points.length > 0 && (
            <p className="text-[10px] text-slate-600 mt-3">
              {item.points.length} titik GPS direkam
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main: AktivitasView ─────────────────────────────────────────────────────

export default function AktivitasView({ siswaId, token }: AktivitasViewProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'rekam' | 'history'>('history');

  // ── Rekam state
  const [isTracking, setIsTracking] = useState(false);
  const [tipe, setTipe] = useState<AktivitasTipe>('jalan');
  const [elapsed, setElapsed] = useState(0);
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsReady, setGpsReady] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef<number>(0);

  // ── Query: history
  const {
    data: history = [],
    isLoading: loadingHistory,
    isError: errorHistory,
  } = useQuery({
    queryKey: ['aktivitas-history', siswaId],
    queryFn: () => fetchAktivitasHistory(siswaId, token),
    enabled: !!siswaId && !!token,
    staleTime: 1000 * 60 * 3,
  });

  // ── Mutation: sync aktivitas
  const syncMutation = useMutation({
    mutationFn: async (payload: {
      siswaId: number;
      tipe: string;
      jarakMeter: number;
      durasiDetik: number;
      kalori: number;
      points: GpsPoint[];
    }) => {
      const res = await axiosInstance.post(`${BASE_URL}/aktivitas`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.success) throw new Error(res.data.message || 'Gagal sync aktivitas');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aktivitas-history', siswaId] });
      setActiveTab('history');
    },
  });

  // ── Update lokasi
  const updateLocationMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      await axiosInstance.post(
        `${BASE_URL}/aktivitas/update-location`,
        { id: siswaId, lat, lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
  });

  // ── GPS watch
  const startTracking = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS');
      return;
    }
    setPoints([]);
    setElapsed(0);
    startTsRef.current = Date.now();
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: GpsPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setPoints(prev => {
          // filter noise: skip titik < 3 meter dari sebelumnya
          if (prev.length > 0) {
            const d = haversineMeters(prev[prev.length - 1], pt);
            if (d < 3) return prev;
          }
          return [...prev, pt];
        });
        setGpsReady(true);
        // Update lokasi siswa di DB setiap titik baru
        updateLocationMutation.mutate({ lat: pt.lat, lng: pt.lng });
      },
      (err) => {
        if (err.code === 1) setGpsError('Izin GPS ditolak');
        else setGpsError('Gagal mendapatkan lokasi');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);
  };

  const handleSelesai = () => {
    stopTracking();
    const jarak = Math.round(totalJarak(points));
    const kalori = estimasiKalori(tipe, jarak, elapsed);
    syncMutation.mutate({ siswaId, tipe, jarakMeter: jarak, durasiDetik: elapsed, kalori, points });
  };

  const handleBatal = () => {
    stopTracking();
    setPoints([]);
    setElapsed(0);
    setGpsReady(false);
  };

  useEffect(() => () => { stopTracking(); }, []);

  // ── Summary stats
  const totalJarakAll = history.reduce((a, h) => a + (h.jarakMeter ?? 0), 0);
  const totalKaloriAll = history.reduce((a, h) => a + (h.kalori ?? 0), 0);
  const totalDurasiAll = history.reduce((a, h) => a + (h.durasiDetik ?? 0), 0);

  // ── Live jarak
  const liveJarak = Math.round(totalJarak(points));

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-white">
      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-4 pb-2">
        {(['history', 'rekam'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => !isTracking && setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
              activeTab === tab
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            } ${isTracking && tab === 'history' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {tab === 'history' ? 'Riwayat' : 'Rekam Aktivitas'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 pt-2">

        {/* ════════ REKAM TAB ════════ */}
        {activeTab === 'rekam' && (
          <>
            {/* Tipe aktivitas */}
            {!isTracking && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Jenis Aktivitas
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(TIPE_CONFIG) as AktivitasTipe[]).map((t) => {
                    const { label, color } = TIPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setTipe(t)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all active:scale-95 ${
                          tipe === t ? color + ' border-current' : 'bg-slate-800/60 text-slate-400 border-white/[0.06]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live tracker */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-800/40 p-5 space-y-4">
              {/* Stopwatch */}
              <div className="text-center">
                <p className="text-5xl font-black tabular-nums tracking-tight text-white">
                  {formatDurasi(elapsed)}
                </p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                  {isTracking ? (gpsReady ? 'GPS aktif · merekam' : 'Menunggu sinyal GPS...') : 'Siap direkam'}
                </p>
              </div>

              {/* Live stats */}
              {isTracking && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-700/50 px-4 py-3 text-center">
                    <p className="text-xl font-black">{formatJarak(liveJarak)}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Jarak</p>
                  </div>
                  <div className="rounded-xl bg-slate-700/50 px-4 py-3 text-center">
                    <p className="text-xl font-black">{estimasiKalori(tipe, liveJarak, elapsed)}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">kkal</p>
                  </div>
                </div>
              )}

              {/* GPS Error */}
              {gpsError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-300">{gpsError}</p>
                </div>
              )}

              {/* CTA buttons */}
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center justify-center gap-2 transition active:scale-[0.97]"
                >
                  <Play size={14} />
                  Mulai Rekam
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleBatal}
                    className="py-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-[11px] font-black uppercase tracking-widest text-slate-300 transition active:scale-[0.97]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSelesai}
                    disabled={syncMutation.isPending || elapsed < 5}
                    className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition active:scale-[0.97] ${
                      elapsed >= 5
                        ? 'bg-blue-600 hover:bg-blue-500'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {syncMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Selesai
                  </button>
                </div>
              )}
            </div>

            {syncMutation.isError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{(syncMutation.error as Error)?.message}</p>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 px-4 py-3 space-y-1">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Tips</p>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Pastikan GPS aktif & izin lokasi diberikan</li>
                <li>Buka aplikasi di luar ruangan untuk sinyal terbaik</li>
                <li>Data otomatis tersimpan saat klik Selesai</li>
              </ul>
            </div>
          </>
        )}

        {/* ════════ HISTORY TAB ════════ */}
        {activeTab === 'history' && (
          <>
            {loadingHistory && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={24} className="animate-spin text-emerald-400" />
                <p className="text-xs text-slate-500">Memuat riwayat aktivitas...</p>
              </div>
            )}

            {!loadingHistory && errorHistory && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">Gagal memuat riwayat.</p>
              </div>
            )}

            {!loadingHistory && !errorHistory && history.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                  <Activity size={24} className="text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-400">Belum ada aktivitas tercatat</p>
                  <p className="text-xs text-slate-600 mt-1">Mulai rekam aktivitas pertamamu.</p>
                </div>
                <button
                  onClick={() => setActiveTab('rekam')}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase tracking-widest text-white transition active:scale-95"
                >
                  Rekam Sekarang
                </button>
              </div>
            )}

            {!loadingHistory && !errorHistory && history.length > 0 && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-800/60 border border-white/[0.06] px-3 py-3 text-center">
                    <Route size={14} className="text-blue-400 mx-auto mb-1" />
                    <p className="text-sm font-black">{formatJarak(totalJarakAll)}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Total Jarak</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 border border-white/[0.06] px-3 py-3 text-center">
                    <Flame size={14} className="text-orange-400 mx-auto mb-1" />
                    <p className="text-sm font-black">{Math.round(totalKaloriAll)}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">kkal Total</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 border border-white/[0.06] px-3 py-3 text-center">
                    <Timer size={14} className="text-purple-400 mx-auto mb-1" />
                    <p className="text-sm font-black">{formatDurasi(totalDurasiAll)}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Total Waktu</p>
                  </div>
                </div>

                {history.map(item => <AktivitasCard key={item.id} item={item} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}