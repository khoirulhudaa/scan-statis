import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircle,
  BarcodeIcon,
  Bell,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  ListX,
  LogOut,
  Megaphone,
  Newspaper,
  Printer,
  ScanIcon,
  Search,
  Star,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Barcode from 'react-barcode';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';

const BASE_URL_SCHOOL = 'https://be-school.kiraproject.id';
const BASE_URL_PERPUS = 'https://be-perpus.kiraproject.id';

export default function ScannerPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'barcode' | 'history' | 'profile'>('scan');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [barcodeTab, setBarcodeTab] = useState<'nis' | 'nisn'>('nis');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [form, setForm] = useState<any>({
    name: '',
    email: '',
    nis: '',
    nisn: '',
    nip: '',
    oldPassword: '',
    newPassword: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(() =>
    JSON.parse(localStorage.getItem('user_profile') || '{}')
  );
  
  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    const html5QrCode = new Html5Qrcode('reader');

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 24,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            console.log('Scanned QR:', decodedText);
            html5QrCode.stop().then(() => {
              handleScanResult(decodedText);
            });
          },
          // ignore scan errors
          () => {} 
        );
      } catch (err) {
        console.error('Gagal memulai scanner:', err);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [navigate, token]);

  useEffect(() => {
    setForm({
      name: userProfile.name || userProfile.nama || '',
      email: userProfile.email || '',
      nis: userProfile.nis || '',
      nisn: userProfile.nisn || '',
      nip: userProfile.nip || '',
    });
  }, [userProfile]);

  // ────────────────────────────────────────────────
  // Fungsi utama pemrosesan scan (pemisah absen vs perpus)
  // ────────────────────────────────────────────────
  const handleScanResult = async (qrData: string) => {
    // Deteksi QR Perpustakaan berdasarkan domain + path spesifik
    if (qrData.includes('be-perpus.kiraproject.id/peminjam/kehadiran')) {
      await handlePerpusKehadiran(qrData);
    } else {
      // Default: absensi harian sekolah
      await handleAbsensiSekolah(qrData);
    }
  };

  // ────────────────────────────────────────────────
  // 1. Absensi harian sekolah (dengan GPS)
  // ────────────────────────────────────────────────
  const handleAbsensiSekolah = async (qrData: string) => {
    setStatus({ type: 'loading', msg: 'Mengambil Lokasi...' });

    if (!navigator.geolocation) {
      setStatus({ type: 'error', msg: 'Browser tidak mendukung GPS' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatus({ type: 'loading', msg: 'Syncing...' });

        try {
          const res = await axios.post(
            `${BASE_URL_SCHOOL}/scan-qr`,
            {
              qrCodeData: qrData,
              role: userProfile.role === 'siswa' ? 'student' : 'teacher',
              userLat: latitude,
              userLon: longitude,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.success) {
            setStatus({ type: 'success', msg: res.data.message });
          } else {
            setStatus({ type: 'error', msg: res.data.message || 'Gagal absen' });
          }
        } catch (err: any) {
          setStatus({
            type: 'error',
            msg: err.response?.data?.message || 'Gagal melakukan absen',
          });
        }
      },
      (error) => {
        let msg = 'Gagal mendapatkan lokasi';
        if (error.code === 1) msg = 'Mohon izinkan akses lokasi (GPS)';
        if (error.code === 3) msg = 'Waktu pengambilan lokasi habis';
        setStatus({ type: 'error', msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ────────────────────────────────────────────────
  // 2. Kunjungan / Pulang Perpustakaan (tanpa GPS)
  // ────────────────────────────────────────────────
  const handlePerpusKehadiran = async (qrUrl: string) => {
    setStatus({ type: 'loading', msg: 'Memproses kehadiran perpustakaan...' });

    try {
      const url = new URL(qrUrl);
      const modeFromQR = (url.searchParams.get('mode') || '').toUpperCase();
      const schoolIdFromQR = url.searchParams.get('schoolId');

      // AMBIL TOKEN DARI PROFILE SISWA YANG SEDANG LOGIN (Bukan dari QR)
      // Asumsi: userProfile.qrCode berisi "QR-2425001-..."
      const studentToken = userProfile.qrCode || userProfile.qrCodeData; 

      if (!studentToken) {
        setStatus({ type: 'error', msg: 'Data QR Anda tidak ditemukan di profil. Silakan relogin.' });
        return;
      }

      const res = await axios.post(
        `${BASE_URL_PERPUS}/peminjam/kehadiran`,
        {
          qrCodeData: studentToken, // Kirim ID Siswa miliknya sendiri
          mode: modeFromQR,         // Mode ambil dari QR di meja (MASUK/PULANG)
          schoolId: Number(schoolIdFromQR),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        const visitorInfo = {
          name:
            res.data.visitor?.name ||
            res.data.message.replace(/^(Selamat Datang|Sampai Jumpa), /i, '').trim() ||
            'Pengguna',
          mode: modeFromQR,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setStatus({
          type: 'success',
          msg: res.data.message || 
               (modeFromQR === 'MASUK' ? 'Selamat datang di Perpustakaan!' : 'Terima kasih, sampai jumpa!'),
        });

        // Simpan ke localStorage (opsional, untuk persist setelah refresh)
        localStorage.setItem('last_perpus_scan', JSON.stringify({
          ...visitorInfo,
          scannedAt: Date.now(),
        }));
      } else {
        setStatus({ type: 'error', msg: res.data.message || 'Gagal memproses kehadiran' });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        msg: err.response?.data?.message || 'Gagal terhubung ke server perpustakaan',
      });
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoadingProfile(true);

      if (form.newPassword && !form.oldPassword) {
        toast.error('Masukkan password lama terlebih dahulu');
        return;
      }

      const res = await axios.put(
        `${BASE_URL_SCHOOL}/profile/me/biodata`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const oldProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const updatedProfile = { ...oldProfile, ...(res.data.data || form) };

        localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
        setForm({
          name: updatedProfile.name || updatedProfile.nama || '',
          email: updatedProfile.email || '',
          nis: updatedProfile.nis || '',
          nisn: updatedProfile.nisn || '',
          nip: updatedProfile.nip || '',
        });

        toast.success('Profil berhasil diperbarui!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal update profil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setPhotoLoading(true);

      const res = await axios.post(
        `${BASE_URL_SCHOOL}/profile/me/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data.success) {
        const oldProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
        const updatedProfile = { ...oldProfile, ...(res.data.data || form) };

        localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        toast.success('Foto profil berhasil diperbarui!', { id: 'upload-photo' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal upload foto');
    } finally {
      setPhotoLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/siswa/get-attendances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setHistory(res.data.data);
    } catch (err) {
      console.error('Gagal ambil history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const downloadBarcode = () => {
    const canvas = document.querySelector('#barcode-container canvas') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `barcode-${barcodeTab}-${userProfile.nis || userProfile.nip}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const printBarcode = () => {
    const canvas = document.querySelector('#barcode-container canvas') as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const windowContent = `
        <!DOCTYPE html>
        <html>
        <head><title>Print Barcode</title></head>
        <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
          <h3>${userProfile.name || userProfile.nama}</h3>
          <p style="text-transform:uppercase; font-size:12px; margin-bottom:20px;">
            ${barcodeTab.toUpperCase()}: ${
              userProfile.role === 'siswa'
                ? barcodeTab === 'nis'
                  ? userProfile.nis
                  : userProfile.nisn
                : userProfile.nip
            }
          </p>
          <img src="${dataUrl}" style="width:300px;"/>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
      `;
      const printWin = window.open('', '', 'width=600,height=600');
      printWin?.document.open();
      printWin?.document.write(windowContent);
      printWin?.document.close();
    }
  };

  // ─── Dummy data ───────────────────────────────────────────
  const MENU_ITEMS = [
    { id: 'tugas',       label: 'Tugas',        icon: BookOpen,    color: 'from-blue-600 to-blue-500',    badge: '3' },
    { id: 'pengumuman',  label: 'Pengumuman',   icon: Megaphone,   color: 'from-orange-600 to-orange-500', badge: '2' },
    { id: 'berita',      label: 'Berita',       icon: Newspaper,   color: 'from-emerald-600 to-emerald-500', badge: null },
    { id: 'kelulusan',   label: 'Kelulusan',    icon: GraduationCap, color: 'from-purple-600 to-purple-500', badge: null },
    { id: 'osis',        label: 'OSIS',         icon: Users,       color: 'from-rose-600 to-rose-500',    badge: null },
    { id: 'ulasan',      label: 'Ulasan',       icon: Star,        color: 'from-amber-600 to-amber-500',  badge: null },
  ];
  
  const ANNOUNCEMENTS = [
    { id: 1, title: 'Ujian Tengah Semester Genap 2025', date: '20 Mar 2026', type: 'Penting', urgent: true },
    { id: 2, title: 'Libur Hari Raya Idul Fitri 1447 H', date: '18 Mar 2026', type: 'Informasi', urgent: false },
    { id: 3, title: 'Pendaftaran Ekstrakulikuler Baru', date: '15 Mar 2026', type: 'Kegiatan', urgent: false },
  ];
  
  const QUICK_STATS = [
    { label: 'Hadir', value: '22', sub: 'hari ini' },
    { label: 'Tugas', value: '3', sub: 'belum dikumpul' },
    { label: 'Nilai', value: '87', sub: 'rata-rata' },
  ];

  function HomePage({ userProfile = { name: 'Ahmad Fauzi', role: 'siswa', kelas: 'XII IPA 2' } }: any) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
    return (
      <div className="w-full h-full overflow-auto p-4 md:p-6">
        {/* ── TOP SEARCH BAR ─────────────────────────── */}
        <div className="relative top-0 z-[999] bg-[#020617]/90 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-slate-800/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 gap-2">
              <Search size={14} className="text-slate-500 shrink-0" />
              <span className="text-slate-500 text-[11px] font-medium">Cari tugas, berita, atau pengumuman...</span>
            </div>
            <div className="relative w-9 h-9 bg-slate-800/60 border border-white/[0.06] rounded-xl flex items-center justify-center shrink-0">
              <Bell size={15} className="text-slate-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </div>
          </div>
        </div>
  
        <div className="pt-4 space-y-5">
  
          {/* ── BANNER / PROMO CARD ─────────────────── */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-5 shadow-xl shadow-blue-900/30">
            {/* grid texture */}
            <div className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-200 mb-1">Selamat Datang 👋</p>
                <h2 className="text-lg font-black leading-tight">
                  {userProfile.name || 'Siswa'}
                </h2>
                <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wider font-medium">
                  {userProfile.kelas || userProfile.role}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-blue-200 uppercase tracking-wider">Semester</p>
                <p className="text-2xl font-black leading-none">2</p>
                <p className="text-[9px] text-blue-200 uppercase tracking-wider">2025/2026</p>
              </div>
            </div>
  
            {/* quick stats */}
            <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
              {QUICK_STATS.map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                  <p className="text-base font-black">{s.value}</p>
                  <p className="text-[8px] text-blue-100 font-bold uppercase tracking-wide leading-tight">{s.label}</p>
                  <p className="text-[7px] text-blue-200/70 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
  
          {/* ── MENU GRID ───────────────────────────── */}
          <div className='w-full'>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Layanan</p>
            <div className="w-full grid grid-cols-4 gap-5">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className="w-full flex flex-col items-center gap-2 active:scale-[0.94] transition-transform"
                  >
                    <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon size={22} className="text-white" />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[8px] font-black rounded-full flex items-center justify-center shadow">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 text-center leading-tight">{item.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
  
          {/* ── PENGUMUMAN TERBARU ───────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">Pengumuman Terbaru</p>
              <button className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Lihat Semua</button>
            </div>
  
            <div className="space-y-2.5">
              {ANNOUNCEMENTS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-slate-900/50 border border-white/[0.05] rounded-2xl p-3.5"
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.urgent ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                    {item.urgent
                      ? <AlertCircle size={15} className="text-red-400" />
                      : <CheckCircle size={15} className="text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold leading-tight truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${item.urgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                        {item.type}
                      </span>
                      <span className="text-[8px] text-slate-500">{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          {/* ── MOTIVASI / INFO CARD ─────────────────── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800/80 border border-white/[0.05] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Tips Belajar</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                Konsisten belajar 30 menit sehari lebih efektif daripada belajar 3 jam sekali seminggu.
              </p>
            </div>
          </div>
        </div>
  
        {/* ── MODAL MENU ──────────────────────────────── */}
        {activeMenu && (
          <div className="fixed w-full md:w-[32.3vw] mx-auto inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveMenu(null)}
            />
            <div className="relative w-full bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-200 pb-32">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400 mb-1">
                {MENU_ITEMS.find(m => m.id === activeMenu)?.label}
              </p>
              <p className="text-slate-500 text-[10px]">Fitur ini sedang dalam pengembangan</p>
              <button
                onClick={() => setActiveMenu(null)}
                className="mt-5 w-full py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col justify-center items-center font-sans relative">
      <Toaster position="top-right" richColors />

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header Profile Floating */}
      <div className="absolute top-0 h-[8vh] left-0 right-0 md:w-[32.3vw] mx-auto z-20 pointer-events-none">
        <div className="w-screen md:w-full h-full mx-auto flex items-center bg-slate-900 md:xp-6 px-4 border border-white/[0.05] shadow-2xl pointer-events-auto">
          <div className="flex w-[90%] border-r border-white/10 items-center gap-3 h-full">
            {/* <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/20">
              {(userProfile.name || userProfile.nama)?.charAt(0) || '?'}
            </div> */}
            <div className="leading-none w-[82%] h-full mt-[4px] flex flex-col items-start justify-center">
              <h3 className="text-sm font-bold w-full truncate uppercase tracking-wider">
                {userProfile.name || userProfile.nama || 'User'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-medium">
                {userProfile.role || 'Member'}
              </p>
            </div>
          </div>
          <div className="flex items-end flex-1 pl-3 md:pl-12">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="cursor-pointer flex items-center gap-2 ml-auto text-[10px] font-bold text-red-400 hover:text-red-500 tracking-widest transition-colors uppercase"
            >
              <LogOut size={12} className="md:flex hidden" />
              <LogOut size={20} className="md:hidden flex ml-auto" />
              <span className="md:flex hidden">Keluar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* MASTER WRAPER */}
      <div className='relative w-screen md:w-[32.3vw] h-[82vh] my-auto mx-auto overflow-auto'>
          {/* Konten sesuai tab */}
          {activeTab === 'scan' && (
            <div className="flex-1 flex h-full overflow-hidden items-center justify-center p-0 z-10 relative">
              <div className="relative w-full h-full">
                {/* Scanner Brackets */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] z-20 pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl" />
                  <div className="w-full h-[1px] bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]" />
                </div>

                <div id="reader" className="w-full h-full bg-black" />

                {status && (
                  <div
                    className={`absolute h-screen inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 ${
                      status.type === 'success' ? 'bg-blue-500' : 'bg-slate-900/95'
                    }`}
                  >
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/10">
                      {status.type === 'loading' ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-4xl text-white">
                          {status.type === 'success' ? <CheckCircle size={60} /> : <AlertCircle size={60} />}
                        </span>
                      )}
                    </div>
                    <p className="font-bold uppercase tracking-[0.2em] text-sm mb-8">{status.msg}</p>
                    {status.type !== 'loading' && (
                      <button
                        onClick={() => window.location.reload()}
                        className="cursor-pointer active:scale-[0.97] hover:brightness-80 bg-white text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
                      >
                        Kembali
                      </button>
                    )}
                  </div>
                )}

                <div className="absolute top-12 left-0 right-0 text-center z-20 pointer-events-none">
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Active</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'barcode' && (
            <div className="w-full overflow-hidden p-4 md:p-6 h-full flex flex-col items-center justify-center z-10 relative">
              {userProfile.role === 'siswa' && (
                <div className="w-full grid grid-cols-4 mb-10 border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setBarcodeTab('nis')}
                    className={`cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider ${
                      barcodeTab === 'nis' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    NIS
                  </button>
                  <button
                    onClick={() => setBarcodeTab('nisn')}
                    className={`cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider ${
                      barcodeTab === 'nisn' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    NISN
                  </button>
                  <button
                    onClick={downloadBarcode}
                    className="cursor-pointer flex justify-center items-center hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    <Download size={19} />
                  </button>
                  <button
                    onClick={printBarcode}
                    className="cursor-pointer flex justify-center items-center hover:bg-white/10 active:scale-[0.98] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    <Printer size={17.5} />
                  </button>
                </div>
              )}

              <p className="text-white text-sm uppercase tracking-widest mb-6">
                {userProfile.role === 'siswa' ? `Barcode ${barcodeTab.toUpperCase()}` : 'Barcode NIP'}
              </p>

              <div id="barcode-container" className="bg-white w-max rounded-xl">
                <Barcode
                  value={
                    userProfile.role === 'siswa'
                      ? barcodeTab === 'nis'
                        ? userProfile.nis
                        : userProfile.nisn
                      : userProfile.nip
                  }
                  height={100}
                  width={3}
                  renderer="canvas"
                  fontSize={18}
                  margin={10}
                />
              </div>
            </div>
          )}

          {activeTab === 'home' && (
            <HomePage userProfile={userProfile} />
          )}

          {activeTab === 'history' && (
            <div
              className={`w-full h-full flex mx-auto justify-start items-center flex-col p-4 md:p-6 z-10 ${
                history.length > 1 ? 'overflow-y-auto' : 'overflow-hidden'
              }`}
            >
              {loadingHistory ? (
                <div className="flex justify-center p-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col gap-3">
                  {history.length > 0 ? (
                    history.map((item, i) => (
                      <div
                        key={i}
                        className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center"
                      >
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{item.date}</p>
                          <p className="text-xs font-bold mt-1">{item.time} WIB</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                              item.isLate ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {item.isLate ? 'Terlambat' : item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full flex flex-col pb-20 justify-center items-center text-center h-full">
                      <ListX className="text-slate-300 mb-10" size={28} />
                      <p className="text-center text-slate-500 text-md">Belum ada data kehadiran bulan ini</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="w-full h-full flex flex-col items-center justify-start z-10 overflow-y-auto pb-32">
              <div className="w-full p-4 md:p-6">
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                  <div className="relative group">
                    <img
                      src={preview || userProfile.photoUrl || 'https://via.placeholder.com/150'}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                      alt="Profile"
                    />
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-500 transition-colors">
                      <Download size={12} className="text-white rotate-180" />
                      <input type="file" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Profil Pengguna</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                      {userProfile.role || 'Member'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="group">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Nama</p>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
                      placeholder="Nama Lengkap"
                    />
                  </div>

                  <div className="group">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Email</p>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
                      placeholder="Email Sekolah"
                    />
                  </div>

                  <div className="relative group w-full">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Password Lama</p>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={form.oldPassword || ''}
                      onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                      placeholder="Masukkan password lama"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-[30px] cursor-pointer hover:brightness-75 active:scale-[0.98] text-slate-400 hover:text-white"
                    >
                      {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="relative group w-full">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Password Baru</p>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={form.newPassword || ''}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                      placeholder="Masukkan password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-[30px] cursor-pointer hover:brightness-75 active:scale-[0.98] text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {userProfile.role === 'siswa' ? (
                      <>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NIS</p>
                          <input
                            value={form.nis}
                            onChange={(e) => setForm({ ...form, nis: e.target.value })}
                            className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NISN</p>
                          <input
                            value={form.nisn}
                            onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                            className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NIP</p>
                        <input
                          value={form.nip}
                          onChange={(e) => setForm({ ...form, nip: e.target.value })}
                          className="w-full px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={loadingProfile || photoLoading}
                    className="mt-2 w-full py-4 cursor-pointer active:scale-95 hover:bg-blue-800 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    {(loadingProfile || photoLoading) ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          {photoLoading ? 'Mengunggah Data...' : 'Memproses...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Update Profil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Menu Bottom */}
          <div className="fixed bottom-0 w-full left-0 h-[8vh] mx-auto md:w-[32.3vw] right-0 flex justify-center z-20">
            <div className="w-full md:w-max grid grid-cols-5 bg-slate-900 shadow-2xl border-top border-white/10 overflow-hidden">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
                  activeTab === 'home' ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <Home size={18.5} />
                <p>Home</p>
              </button>

              <button
                onClick={() => setActiveTab('scan')}
                className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
                  activeTab === 'scan' ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <ScanIcon size={18.5} />
                <p>Scan</p>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 text-xs cursor-pointer gap-2 text-center flex flex-col justify-center items-center font-bold ${
                  activeTab === 'history' ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <ClipboardList size={18.5} />
                <p>Riwayat</p>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
                  activeTab === 'profile' ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <User size={18.5} />
                <p>Profile</p>
              </button>

              <button
                onClick={() => setActiveTab('barcode')}
                className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
                  activeTab === 'barcode' ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <BarcodeIcon size={18.5} />
                <p>Barcode</p>
              </button>
            </div>
          </div>
      </div>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOut size={32} />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">Konfirmasi Keluar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun ini? Anda perlu masuk kembali nanti.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={logout}
                className="cursor-pointer hover:brightness-85 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 active:scale-[0.97] transition-all"
              >
                Ya, Keluar Sekarang
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="cursor-pointer hover:brightness-85 w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.97] transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}