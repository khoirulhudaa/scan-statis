import { useMutation, useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    Heart,
    HeartHandshake,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    Star,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearbyStudent {
  id: number;
  name: string;
  gender: string;
  class: string;
  batch: string;
  photoUrl?: string;
  distance: number; // km dari API
  schoolId: number;
}

interface BiroJodohViewProps {
  siswaId: number;
  schoolId: number;
  token: string;
  userProfile?: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://be-school.kiraproject.id';

// ─── API ─────────────────────────────────────────────────────────────────────

const fetchNearbyStudents = async (
  lat: number,
  lng: number,
  radius: number,
  schoolId: number,
  token: string
): Promise<NearbyStudent[]> => {
  const res = await axiosInstance.get(`${BASE_URL}/birojodoh`, {
    params: { lat, lng, radius, schoolId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.data.success) throw new Error('Gagal mengambil data');
  return (res.data.data ?? []).filter((s: NearbyStudent) => s.distance > 0); // exclude self
};

const likeStudent = async (
  fromSiswaId: number,
  toSiswaId: number,
  token: string
): Promise<{ match: boolean; message: string }> => {
  const res = await axiosInstance.post(
    `${BASE_URL}/birojodoh/like`,
    { fromSiswaId, toSiswaId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.data.success) throw new Error('Gagal');
  return { match: res.data.match, message: res.data.message };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-base', lg: 'w-20 h-20 text-xl' }[size];
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClass} rounded-2xl object-cover flex-shrink-0 border border-white/10`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center font-black text-pink-300 flex-shrink-0`}>
      {initials}
    </div>
  );
}

function MatchToast({ name, onClose }: { name: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-0 right-0 mx-auto w-[90%] max-w-xs z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-pink-600 to-violet-600 rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-pink-900/40">
        <HeartHandshake size={28} className="text-white flex-shrink-0" />
        <div>
          <p className="text-sm font-black text-white">It's a Match! 🎉</p>
          <p className="text-xs text-pink-200">Kamu dan {name} saling menyukai!</p>
        </div>
        <button onClick={onClose} className="ml-auto text-white/60 hover:text-white">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main: BiroJodohView ─────────────────────────────────────────────────────

export default function BiroJodohView({ siswaId, schoolId, token }: BiroJodohViewProps) {

  const [radius, setRadius] = useState(5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [matchName, setMatchName] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<NearbyStudent | null>(null);

  // ── Get GPS coords
  const getLocation = () => {
    setGpsError(null);
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? 'Izin lokasi ditolak' : 'Gagal mendapatkan lokasi');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  // ── Query: nearby students
  const {
    data: students = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['birojodoh', coords?.lat, coords?.lng, radius, schoolId],
    queryFn: () => fetchNearbyStudents(coords!.lat, coords!.lng, radius, schoolId, token),
    enabled: !!coords && !!schoolId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Mutation: like
  const likeMutation = useMutation({
    mutationFn: ({ toSiswaId }: { toSiswaId: number; toName: string }) =>
      likeStudent(siswaId, toSiswaId, token),
    onSuccess: (data, variables) => {
      setLikedIds(prev => new Set([...prev, variables.toSiswaId]));
      if (data.match) {
        setMatchName(variables.toName);
      }
    },
  });

  const handleLike = (student: NearbyStudent) => {
    if (likedIds.has(student.id) || likeMutation.isPending) return;
    likeMutation.mutate({ toSiswaId: student.id, toName: student.name });
  };

  const formatDistance = (d: number) => {
    if (d < 1) return `${Math.round(d * 1000)} m`;
    return `${d.toFixed(1)} km`;
  };

  const genderColor = (g: string) =>
    g?.toLowerCase() === 'perempuan'
      ? 'text-pink-400 bg-pink-500/10 border-pink-500/20'
      : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col bg-transparent text-white">
      {/* Match toast */}
      {matchName && <MatchToast name={matchName} onClose={() => setMatchName(null)} />}

      {/* ── Header & Controls ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Biro Jodoh</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {coords
                ? `${students.length} siswa ditemukan dalam ${radius} km`
                : 'Mendeteksi lokasi...'}
            </p>
          </div>
          <button
            onClick={() => { getLocation(); refetch(); }}
            disabled={isFetching || gpsLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/60 border border-white/[0.06] text-slate-400 hover:text-white transition active:scale-95 disabled:opacity-40"
          >
            {isFetching || gpsLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        </div>

        {/* Radius slider */}
        <div className="flex items-center gap-3">
          <MapPin size={12} className="text-pink-400 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            onMouseUp={() => refetch()}
            onTouchEnd={() => refetch()}
            className="flex-1 accent-pink-500"
          />
          <span className="text-xs font-black text-pink-300 w-12 text-right">{radius} km</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* GPS error */}
        {gpsError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-red-300">{gpsError}</p>
            </div>
            <button
              onClick={getLocation}
              className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading */}
        {(isLoading || gpsLoading) && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={24} className="animate-spin text-pink-400" />
            <p className="text-xs text-slate-500">
              {gpsLoading ? 'Mendeteksi lokasi GPS...' : 'Mencari siswa terdekat...'}
            </p>
          </div>
        )}

        {/* Fetch error */}
        {!isLoading && isError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">{(error as Error)?.message || 'Gagal memuat data'}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && coords && students.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
              <Search size={24} className="text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-400">Tidak ada siswa di sekitarmu</p>
              <p className="text-xs text-slate-600 mt-1">Coba perbesar radius pencarian.</p>
            </div>
            <button
              onClick={() => { setRadius(r => Math.min(r + 10, 50)); setTimeout(refetch, 100); }}
              className="px-6 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-black uppercase tracking-widest text-white transition active:scale-95"
            >
              Perluas Radius
            </button>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && students.map(student => {
          const liked = likedIds.has(student.id);
          return (
            <div
              key={student.id}
              className="rounded-2xl border border-white/[0.06] bg-slate-800/40 overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
              >
                <AvatarCircle name={student.name} photoUrl={student.photoUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{student.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${genderColor(student.gender)}`}>
                      {student.gender || 'N/A'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-md">
                      {student.class}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={9} className="text-slate-600" />
                    <p className="text-[10px] text-slate-500">{formatDistance(student.distance)}</p>
                  </div>
                </div>

                {/* Like button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(student); }}
                  disabled={liked || (likeMutation.isPending && likeMutation.variables?.toSiswaId === student.id)}
                  className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-200 active:scale-90 ${
                    liked
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-400'
                      : 'bg-slate-700/60 border-white/[0.06] text-slate-400 hover:border-pink-500/40 hover:text-pink-400 hover:bg-pink-500/10'
                  }`}
                >
                  {likeMutation.isPending && likeMutation.variables?.toSiswaId === student.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Heart size={16} className={liked ? 'fill-current' : ''} />
                  )}
                </button>
              </div>

              {/* Expanded detail */}
              {selectedStudent?.id === student.id && (
                <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-700/40 px-3 py-2">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Kelas</p>
                      <p className="text-xs font-black text-white mt-0.5">{student.class || '-'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-700/40 px-3 py-2">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest">Angkatan</p>
                      <p className="text-xs font-black text-white mt-0.5">{student.batch || '-'}</p>
                    </div>
                  </div>
                  {!liked && (
                    <button
                      onClick={() => handleLike(student)}
                      disabled={likeMutation.isPending}
                      className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-[11px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition active:scale-[0.97]"
                    >
                      <Heart size={13} />
                      Suka {student.name.split(' ')[0]}
                    </button>
                  )}
                  {liked && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Heart size={13} className="text-pink-400 fill-current" />
                      <p className="text-xs text-pink-300 font-semibold">Sudah kamu sukai</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Liked count badge */}
        {likedIds.size > 0 && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Star size={12} className="text-amber-400" />
            <p className="text-[11px] text-slate-400">
              Kamu sudah menyukai{' '}
              <span className="text-amber-300 font-black">{likedIds.size} orang</span> hari ini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}