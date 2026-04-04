import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import { useFaceApi } from '../hooks/useFaceApi';
import axiosInstance from '../utils/axiosInstance';

const BASE_URL = 'https://be-school.kiraproject.id';

type Mode = 'idle' | 'enrollment' | 'absen';
type StatusType = { type: 'idle'|'loading'|'success'|'error'|'detecting'; msg: string };

export default function FaceView() {
    const token                   = localStorage.getItem('token') ?? '';
    const videoRef                = useRef<HTMLVideoElement>(null);
    const streamRef               = useRef<MediaStream | null>(null);
    const detectionIntervalRef    = useRef<any>(null);
    const { isLoaded, getDescriptor, compareDescriptors } = useFaceApi();

    const [mode,        setMode]        = useState<Mode>('idle');
    const [status,      setStatus]      = useState<StatusType>({ type: 'idle', msg: '' });
    const [faceDetected, setFaceDetected] = useState(false);
    const [enrolled,    setEnrolled]    = useState<boolean | null>(null);
    const [enrolledAt,  setEnrolledAt]  = useState<string | null>(null);

    // ── Start kamera ────────────────────────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setStatus({ type: 'error', msg: 'Gagal membuka kamera. Pastikan izin diberikan.' });
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        clearInterval(detectionIntervalRef.current);
    };

    // ── Cek status enrollment ───────────────────────────────────────────────
    const checkEnrollment = async () => {
        try {
            const res = await axiosInstance.get(`${BASE_URL}/face/descriptor`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrolled(res.data.enrolled);
            if (res.data.enrolledAt) {
                setEnrolledAt(new Date(res.data.enrolledAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }));
            }
        } catch {
            setEnrolled(false);
        }
    };

    useEffect(() => {
        checkEnrollment();
    }, []);

    // ── Deteksi wajah realtime (indicator) ─────────────────────────────────
    useEffect(() => {
        if (!isLoaded || mode === 'idle') return;

        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            const result = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();
            setFaceDetected(!!result);
        }, 500);

        return () => clearInterval(detectionIntervalRef.current);
    }, [isLoaded, mode]);

    // ── Mulai mode ──────────────────────────────────────────────────────────
    const handleStartMode = async (m: Mode) => {
        setMode(m);
        setStatus({ type: 'idle', msg: '' });
        await startCamera();
    };

    const handleCancel = () => {
        stopCamera();
        setMode('idle');
        setStatus({ type: 'idle', msg: '' });
        setFaceDetected(false);
    };

    // ── ENROLLMENT ──────────────────────────────────────────────────────────
    const handleEnroll = async () => {
        if (!isLoaded || !videoRef.current) return;
        setStatus({ type: 'loading', msg: 'Mendeteksi wajah...' });

        const descriptor = await getDescriptor(videoRef.current);
        if (!descriptor) {
            setStatus({ type: 'error', msg: 'Wajah tidak terdeteksi. Pastikan pencahayaan cukup dan posisikan wajah di tengah.' });
            return;
        }

        setStatus({ type: 'loading', msg: 'Menyimpan data wajah...' });
        try {
            const res = await axiosInstance.post(
                `${BASE_URL}/face/enroll`,
                { descriptor: Array.from(descriptor) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setStatus({ type: 'success', msg: 'Wajah berhasil didaftarkan! ✅' });
                setEnrolled(true);
                setEnrolledAt(new Date().toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }));
                setTimeout(() => handleCancel(), 2000);
            }
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan wajah' });
        }
    };

    // ── ABSENSI ─────────────────────────────────────────────────────────────
    const handleAbsen = async () => {
        if (!isLoaded || !videoRef.current) return;
        setStatus({ type: 'loading', msg: 'Mendeteksi wajah...' });

        // 1. Ambil descriptor live dari kamera
        const liveDescriptor = await getDescriptor(videoRef.current);
        if (!liveDescriptor) {
            setStatus({ type: 'error', msg: 'Wajah tidak terdeteksi. Coba lagi.' });
            return;
        }

        // 2. Ambil descriptor tersimpan dari backend
        setStatus({ type: 'loading', msg: 'Memverifikasi identitas...' });
        let savedDescriptor: number[];
        try {
            const res = await axiosInstance.get(`${BASE_URL}/face/descriptor`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.data.enrolled) {
                setStatus({ type: 'error', msg: 'Wajah belum didaftarkan. Lakukan enrollment dulu.' });
                return;
            }
            savedDescriptor = res.data.descriptor;
        } catch {
            setStatus({ type: 'error', msg: 'Gagal mengambil data wajah dari server.' });
            return;
        }

        // 3. Bandingkan descriptor
        const { match, distance } = compareDescriptors(liveDescriptor, savedDescriptor);
        console.log('[FACE] distance:', distance.toFixed(4), '| match:', match);

        if (!match) {
            setStatus({ type: 'error', msg: `Wajah tidak dikenali (jarak: ${distance.toFixed(2)}). Coba lagi dengan pencahayaan lebih baik.` });
            return;
        }

        // 4. Kirim absensi + GPS
        setStatus({ type: 'loading', msg: 'Wajah cocok! Mengambil lokasi...' });
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    setStatus({ type: 'loading', msg: 'Mencatat absensi...' });
                    const res = await axiosInstance.post(
                        `${BASE_URL}/face/absen`,
                        {
                            userLat:      pos.coords.latitude,
                            userLon:      pos.coords.longitude,
                            faceDistance: distance,
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (res.data.success) {
                        setStatus({ type: 'success', msg: '✅ Absensi wajah berhasil!' });
                        setTimeout(() => handleCancel(), 2500);
                    } else {
                        setStatus({ type: 'error', msg: res.data.message });
                    }
                } catch (err: any) {
                    setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal absensi' });
                }
            },
            (err) => {
                let msg = 'Gagal mendapatkan lokasi';
                if (err.code === 1) msg = 'Mohon izinkan akses GPS';
                setStatus({ type: 'error', msg });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ── RENDER ──────────────────────────────────────────────────────────────
    return (
        <div className="w-full h-full overflow-auto p-4 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-black uppercase tracking-wider">Absensi Wajah</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {enrolled === null ? 'Memuat...' :
                         enrolled ? `✅ Wajah terdaftar sejak ${enrolledAt}` :
                         '⚠️ Wajah belum didaftarkan'}
                    </p>
                </div>
                {mode !== 'idle' && (
                    <button
                        onClick={handleCancel}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                    >
                        Batal
                    </button>
                )}
            </div>

            {/* Kamera */}
            {mode !== 'idle' && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 aspect-square w-full max-w-xs mx-auto">
                    <video
                        ref={videoRef}
                        autoPlay muted playsInline
                        className="w-full h-full object-cover scale-x-[-1]"
                        onLoadedMetadata={() => videoRef.current?.play()}
                    />

                    {/* Overlay lingkaran panduan */}
                    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                        <div className={`w-48 h-48 rounded-full border-4 transition-colors duration-300 ${
                            faceDetected ? 'border-emerald-400' : 'border-white/30 border-dashed'
                        }`} />
                    </div>

                    {/* Indikator wajah terdeteksi */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            faceDetected
                                ? 'bg-emerald-500/80 text-white'
                                : 'bg-slate-700/80 text-slate-400'
                        }`}>
                            {faceDetected ? '✅ Wajah terdeteksi' : 'Arahkan wajah ke kamera'}
                        </span>
                    </div>

                    {/* Loading model overlay */}
                    {!isLoaded && (
                        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                            <p className="text-xs text-slate-300 animate-pulse">Memuat model AI...</p>
                        </div>
                    )}
                </div>
            )}

            {/* Status */}
            {status.msg && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium text-center ${
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    status.type === 'error'   ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-slate-700/50 text-slate-300 border border-slate-600/20'
                }`}>
                    {status.msg}
                </div>
            )}

            {/* Tombol aksi */}
            {mode === 'idle' && (
                <div className="flex flex-col gap-3 mt-2">
                    {/* Absensi */}
                    <button
                        onClick={() => handleStartMode('absen')}
                        disabled={enrolled === false}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl font-black text-sm uppercase tracking-widest transition active:scale-[0.97]"
                    >
                        📷 Scan Wajah untuk Absen
                    </button>

                    {/* Enrollment */}
                    <button
                        onClick={() => handleStartMode('enrollment')}
                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest transition active:scale-[0.97]"
                    >
                        {enrolled ? '🔄 Perbarui Data Wajah' : '➕ Daftarkan Wajah'}
                    </button>
                </div>
            )}

            {mode === 'enrollment' && (
                <button
                    onClick={handleEnroll}
                    disabled={!isLoaded || status.type === 'loading'}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-2xl font-black text-sm uppercase tracking-widest transition active:scale-[0.97]"
                >
                    {status.type === 'loading' ? 'Memproses...' : '📸 Ambil & Simpan Wajah'}
                </button>
            )}

            {mode === 'absen' && (
                <button
                    onClick={handleAbsen}
                    disabled={!isLoaded || !faceDetected || status.type === 'loading'}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-2xl font-black text-sm uppercase tracking-widest transition active:scale-[0.97]"
                >
                    {status.type === 'loading' ? 'Memproses...' :
                     !faceDetected ? 'Menunggu wajah...' : '✅ Absen Sekarang'}
                </button>
            )}

            {/* Info tips */}
            {mode !== 'idle' && (
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        💡 <span className="font-semibold">Tips:</span> Pastikan pencahayaan cukup, wajah menghadap kamera, dan tidak menggunakan kacamata gelap.
                    </p>
                </div>
            )}
        </div>
    );
}