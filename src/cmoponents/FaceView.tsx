import * as faceapi from 'face-api.js';
import { Info, Plus, RotateCw, ScanFace, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";
import { useFaceApi } from '../hooks/useFaceApi';
import axiosInstance from '../utils/axiosInstance';

const BASE_URL = 'https://be-school.kiraproject.id';

type Mode = 'idle' | 'enrollment' | 'absen';
type StatusType = { type: 'idle' | 'loading' | 'success' | 'error' | 'detecting'; msg: string };

export default function FaceView() {
    const token = localStorage.getItem('token') ?? '';
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionIntervalRef = useRef<any>(null);
    const { isLoaded, getDescriptor, compareDescriptors } = useFaceApi();

    const [mode, setMode] = useState<Mode>('idle');
    const [status, setStatus] = useState<StatusType>({ type: 'idle', msg: '' });
    const [faceDetected, setFaceDetected] = useState(false);
    const [enrolled, setEnrolled] = useState<boolean | null>(null);
    const [enrolledAt, setEnrolledAt] = useState<string | null>(null);
    console.log(enrolledAt)
    // Socket.io Implementation
    useEffect(() => {
        if (!token) return;
        const socket = io("https://be-school.kiraproject.id", { transports: ["websocket"] });

        socket.on("connect", () => {
            // socket.emit("join-school", schoolId); 
        });

        socket.on("attendance:face", (data: any) => {
            if (data.success) {
                setStatus({
                    type: 'success',
                    msg: `✅ Absensi berhasil! Selamat ${data.student.name}`
                });
                setTimeout(() => handleCancel(), 2500);
            }
        });

        return () => { socket.disconnect(); };
    }, [token]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setStatus({ type: 'error', msg: 'Gagal membuka kamera. Pastikan izin diberikan.' });
        }
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        clearInterval(detectionIntervalRef.current);
    };

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

    useEffect(() => { checkEnrollment(); }, []);

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

    const handleEnroll = async () => {
        if (!isLoaded || !videoRef.current) return;
        setStatus({ type: 'loading', msg: 'Mendeteksi wajah...' });

        const descriptor = await getDescriptor(videoRef.current);
        if (!descriptor) {
            setStatus({ type: 'error', msg: 'Wajah tidak terdeteksi. Posisikan wajah di tengah.' });
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
                setStatus({ type: 'success', msg: res.data.isUpdate ? '✅ Data wajah diperbarui!' : '✅ Wajah didaftarkan!' });
                setEnrolled(true);
                setEnrolledAt(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                setTimeout(() => handleCancel(), 2500);
            }
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal menyimpan wajah' });
        }
    };

    const handleAbsen = async () => {
        if (!isLoaded || !videoRef.current) return;
        setStatus({ type: 'loading', msg: 'Memverifikasi...' });

        const liveDescriptor = await getDescriptor(videoRef.current);
        if (!liveDescriptor) {
            setStatus({ type: 'error', msg: 'Wajah tidak terdeteksi.' });
            return;
        }

        try {
            const resDesc = await axiosInstance.get(`${BASE_URL}/face/descriptor`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resDesc.data.enrolled) {
                setStatus({ type: 'error', msg: 'Wajah belum terdaftar.' });
                return;
            }

            const { match, distance } = compareDescriptors(liveDescriptor, resDesc.data.descriptor);
            if (!match) {
                setStatus({ type: 'error', msg: `Wajah tidak cocok (Dist: ${distance.toFixed(2)})` });
                return;
            }

            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await axiosInstance.post(
                        `${BASE_URL}/face/absen`,
                        { userLat: pos.coords.latitude, userLon: pos.coords.longitude, faceDistance: distance },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (res.data.success) {
                        setStatus({ type: 'success', msg: '✅ Absensi Berhasil!' });
                        setTimeout(() => handleCancel(), 2500);
                    }
                } catch (err: any) {
                    setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal absen' });
                }
            }, (err) => setStatus({ type: 'error', msg: 'Gagal GPS: ' + err.message }), 
            { enableHighAccuracy: true });

        } catch {
            setStatus({ type: 'error', msg: 'Gagal verifikasi server.' });
        }
    };

    return (
        <div className="w-full h-max pt-4 flex flex-col p-4 gap-4 text-white">
            {/* Middle Section: Camera or Dashboard Placeholder */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {mode !== 'idle' ? (
                    /* Kamera Aktif */
                    <div className="relative rounded-3xl overflow-hidden bg-slate-800 border-4 border-slate-700 aspect-square w-full max-w-[100%] shadow-2xl shadow-emerald-500/10">
                        <video
                            ref={videoRef}
                            autoPlay muted playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className={`w-56 h-56 rounded-full border-2 transition-all duration-500 ${
                                faceDetected ? 'border-emerald-400 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'border-white/20 border-dashed scale-100'
                            }`} />
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-colors ${
                                faceDetected ? 'bg-emerald-500 text-white' : 'bg-slate-900/80 text-slate-400 backdrop-blur-md'
                            }`}>
                                {faceDetected ? 'Face Detected' : 'Position Your Face'}
                            </span>
                        </div>
                        {!isLoaded && (
                            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3">
                                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Loading AI Models...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Dashboard Placeholder (Tampilan saat idle) */
                    <div className="w-full max-w-[100%] bg-slate-800/40 border border-slate-700/50 rounded-[1.5rem] p-8 flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center border border-slate-600 shadow-xl">
                                <ScanFace size={48} className={enrolled ? "text-emerald-400" : "text-slate-500"} />
                            </div>
                            {enrolled && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 p-1.5 rounded-xl shadow-lg">
                                    <ShieldCheck size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                        <h3 className="text-base font-bold text-slate-200 mb-2">
                            {enrolled ? 'Sistem Siap Absen' : 'Pendaftaran Diperlukan'}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed px-4">
                            {enrolled 
                                ? 'Gunakan fitur Scan Wajah untuk melakukan absensi kehadiran harian Anda.' 
                                : 'Anda belum mendaftarkan data biometrik. Silakan klik tombol daftar di bawah.'}
                        </p>
                        
                        <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                                <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Method</p>
                                <p className="text-[11px] font-bold text-slate-300 italic">FaceAPI v1</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                                <p className="text-[9px] uppercase text-slate-500 font-black mb-1">Security</p>
                                <p className="text-[11px] font-bold text-emerald-500 italic">Encrypted</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Feedback */}
            {status.msg && (
                <div className={`mx-auto max-w-[100%] w-full px-4 py-3 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in duration-300 ${
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    status.type === 'error'   ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                    {status.msg}
                </div>
            )}

            {/* Action Buttons */}
            <div className="max-w-[100%] mx-auto w-full flex flex-col gap-3 pb-6">
                {mode === 'idle' && (
                    <>
                        <button
                            onClick={() => handleStartMode('absen')}
                            disabled={!enrolled}
                            className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:grayscale rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                        >
                            <ScanFace size={20} /> Mulai Scan Wajah
                        </button>

                        <button
                            onClick={() => handleStartMode('enrollment')}
                            className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] border border-slate-700"
                        >
                            {enrolled ? <RotateCw size={18} className="text-slate-400" /> : <Plus size={18} className="text-emerald-400" />}
                            {enrolled ? 'Update Data Wajah' : 'Daftarkan Wajah'}
                        </button>
                    </>
                )}

                {mode === 'enrollment' && (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleEnroll}
                            disabled={!isLoaded || status.type === 'loading'}
                            className="w-full cursor-pointer py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                        >
                            {status.type === 'loading' ? 'Memproses...' : '📸 Ambil & Simpan'}
                        </button>
                        <button onClick={handleCancel} className="cursor-pointer w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:text-red-500 font-bold uppercase text-[11px] tracking-widest">
                            <X size={16} /> Batalkan Pendaftaran
                        </button>
                    </div>
                )}

                {mode === 'absen' && (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleAbsen}
                            disabled={!isLoaded || !faceDetected || status.type === 'loading'}
                            className="cursor-pointer w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-emerald-900/40"
                        >
                            {status.type === 'loading' ? 'Memproses...' : '✅ Konfirmasi Kehadiran'}
                        </button>
                        <button onClick={handleCancel} className="cursor-pointer w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-400 font-bold uppercase text-[11px] tracking-widest">
                            <X size={16} /> Tutup Kamera
                        </button>
                    </div>
                )}
                
                {mode !== 'idle' && (
                    <div className="bg-slate-800/30 rounded-2xl p-3 flex gap-3 items-start border border-slate-700/30">
                        <Info size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-tight">
                            Pastikan Anda berada di tempat terang dan wajah tidak tertutup masker/kacamata hitam.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}