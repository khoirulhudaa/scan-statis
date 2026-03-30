import axios from 'axios';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Html5Qrcode } from 'html5-qrcode';
import {
  BookOpen,
  GraduationCap,
  LogOut,
  Megaphone,
  Newspaper,
  Pen,
  QrCode,
  Star,
  Users
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import AnnouncementContent from './cmoponents/AnnouncementContent';
import BarcodeView from './cmoponents/barcodeView';
import BottomTabNavigator from './cmoponents/BottomTabNavigator';
import HistoryView from './cmoponents/HistoryView';
import HomeHeader from './cmoponents/HomeHeader';
import KelulusanContent from './cmoponents/KelulusanContent';
import LatestAnnouncements from './cmoponents/LatestAnnouncements';
import NewsContent from './cmoponents/NewsContent';
import OsisContent from './cmoponents/OsisContent';
import ProfileView from './cmoponents/ProfileView';
import ScanView from './cmoponents/ScanView';
import ServiceMenuGrid from './cmoponents/ServiceMenuGrid';
import TugasContent from './cmoponents/TugasContent';
import UlasanContent from './cmoponents/UlasanContent';
import WelcomeBanner from './cmoponents/WelcomeBanner';
import { useScannerState } from './hooks/useScannerState';
import { useSchoolHomeData } from './hooks/useSchoolHomeData';

const BASE_URL_SCHOOL = 'https://be-school.kiraproject.id';
const BASE_URL_PERPUS = 'https://be-perpus.kiraproject.id';
const BASE_URL = 'https://be-school.kiraproject.id'

export default function ScannerPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const state = useScannerState();
  const {
    status, setStatus,
    activeTab, setActiveTab,
    showLogoutConfirm, setShowLogoutConfirm,
    barcodeTab, setBarcodeTab,
    history, setHistory,
    loadingHistory, setLoadingHistory,
    showOldPassword, setShowOldPassword,
    showNewPassword, setShowNewPassword,
    form, setForm,
    loadingProfile, setLoadingProfile,
    classList, setClassList,
    loadingClass, setLoadingClass,
    photoLoading, setPhotoLoading,
    preview, setPreview,
    userProfile, setUserProfile,
    schoolId, setSchoolId,
    announcements, setAnnouncements,
    news, setNews,
    tugas, setTugas,
    osisData, setOsisData,
    alumniData, setAlumniData,
    comments, setComments,
    avgRating, setAvgRating,
    loadingData, setLoadingData,
    errorData, setErrorData,
    selectedAnnouncement, setSelectedAnnouncement,
    showLoginQrScanner, setShowLoginQrScanner,
    loginQrStatus, setLoginQrStatus,
    setLoginQrMessage,
    scannerActive, setScannerActive,
  } = state;

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
        toast.error("Gagal membuka kamera. Pastikan izin diberikan."); 
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
      class: userProfile.class || '',
    });
  }, [userProfile]);

  // console.log('userRPifle id', userProfile.schoolId)
   useEffect(() => {
      const fetchClasses = async () => {
        try {
          setLoadingClass(true);

          const res = await axios.get(
            `${BASE_URL}/kelas?schoolId=${userProfile.schoolId}`
          );

          if (res.data.success) {
            setClassList(res.data.data);
          }

        } catch (err) {
          console.error('Gagal ambil kelas');
        } finally {
          setLoadingClass(false);
        }
      };

      if (userProfile.schoolId) {
        fetchClasses();
      }
    }, [userProfile.schoolId]);

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
          let qrPosition = 'left';

          if (qrData.includes('_RIGHT')) {
            qrPosition = 'right';
          }
          const res = await axios.post(
            `${BASE_URL_SCHOOL}/scan-qr/double-qr`,
            {
              qrCodeData: qrData,
              role: userProfile.role === 'siswa' ? 'student' : 'teacher',
              userLat: latitude,
              userLon: longitude,
              qrPosition 
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
          class: updatedProfile.class || '',
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
      // console.log('history', res.data)
      if (res.data.success) setHistory(res.data.data);
    } catch (err) {
      console.error('Gagal ambil history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

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
    { id: 'berita',      label: 'Berita',       icon: Newspaper,   color: 'from-emerald-600 to-emerald-500', badge: undefined },
    { id: 'kelulusan',   label: 'Kelulusan',    icon: GraduationCap, color: 'from-purple-600 to-purple-500', badge: undefined },
    { id: 'osis',        label: 'OSIS',         icon: Users,       color: 'from-rose-600 to-rose-500',    badge: undefined },
    { id: 'ulasan',      label: 'Ulasan',       icon: Star,        color: 'from-amber-600 to-amber-500',  badge: undefined },
    { 
      id: 'login-qr', 
      label: 'Login QR', 
      icon: QrCode,                 // import { QrCode } from 'lucide-react'
      color: 'from-cyan-600 to-cyan-500', 
      badge: null 
    },
  ];

  const isSiswa = userProfile.role === 'siswa';

  const QUICK_STATS = isSiswa 
  ? [
      { label: 'Hadir', value: history ? history?.filter((d: any) => d.status === 'Terlambat' || d.status === 'Hadir').length : '0', sub: 'hari ini' },
      { label: 'Tugas', value: tugas ? tugas.length : '0', sub: 'belum dikumpul' },
      { 
        label: 'Presensi', 
        value: history ? `${Math.round((history.filter((d: any) => d.status === 'Hadir').length / 22) * 100)}%` : '0%', 
        sub: 'bulan ini' 
      }
    ]
  : [
      { label: 'Hadir', value: history ? history.filter((d: any) => d.status === 'Terlambat' || d.status === 'Hadir').length : '0', sub: 'hari ini' }, // Menampilkan status hadir saja
    ];

  // ────────────────────────────────────────────────
  // Fetch semua data penting saat component mount / home active
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !userProfile) return;

    // Ambil schoolId dari profile (asumsi sudah ada)
    const sid = userProfile.schoolId || userProfile.school_id;
    if (sid) {
      setSchoolId(Number(sid));
    } else {
      console.warn("schoolId tidak ditemukan di userProfile");
    }

    // Fetch hanya saat tab home aktif
  }, [activeTab === 'home', token, userProfile]);

  const { loadHomeData } = useSchoolHomeData();
  const hasFetched = useRef(false);

  useEffect(() => {
  if (activeTab !== 'home' || !schoolId || !token) {
    hasFetched.current = false;
    return;
  }

  if (hasFetched.current) return;
  hasFetched.current = true;

  loadHomeData(schoolId, token, {
    setAnnouncements,
    setNews,
    setTugas,
    setOsisData,
    setAlumniData,
    setComments,
    setAvgRating,
    setLoadingData,
    setErrorData,
  }).catch(console.error);
}, [activeTab, schoolId, token, loadHomeData]);

  // Tambahkan ref di atas
  const readerRef:any = useRef(null);

  useEffect(() => {
    if (!showLoginQrScanner || !scannerActive) return;

    // Inisialisasi instance
    const html5QrCode = new Html5Qrcode("login-qr-reader");
    readerRef.current = html5QrCode;

    const startScanning = async () => {
      try {
        setLoginQrStatus('scanning');
        await html5QrCode.start(
          { facingMode: "environment" },
          { 
            fps: 24, 
            qrbox: (w, h) => {
              const minEdge = Math.min(w, h);
              const qrboxSize = Math.floor(minEdge * 0.8);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0 
          },
          async (decodedText) => {
            // 1. Hentikan scanner dengan aman
            try {
              await html5QrCode.stop();
            } catch (e) {
              console.warn("Stop on scan error", e);
            }
            
            // 2. Update status dan tutup overlay jika perlu
            setLoginQrStatus('processing');
            setShowLoginQrScanner(false); // Sembunyikan UI setelah berhasil
            await handleExternalLogin(decodedText.trim());
          },
          () => {} 
        );
      } catch (err) {
        console.error("Gagal memulai scanner:", err);
        toast.error("Gagal membuka kamera. Pastikan izin diberikan."); 
        setLoginQrStatus('error');
        setLoginQrMessage("Gagal membuka kamera.");
      }
    };

    startScanning();

    // Cleanup Function
    return () => {
      if (readerRef.current && readerRef.current.isScanning) {
        readerRef.current.stop()
          .then(() => {
            readerRef.current.clear(); // Bersihkan sisa elemen DOM
          })
          .catch((err: any) => console.log("Cleanup error:", err));
      }
    };
  }, [showLoginQrScanner, scannerActive]);

  const handleExternalLogin = async (decodedSessionId: string) => {
    // 1. Tampilkan loading dan simpan ID-nya
    const toastId = toast.loading('Menghubungkan ke server...');

    try {
      const res = await axios.post(
        `${BASE_URL_SCHOOL}/scan-qr/login-qr-new`,
        { qrCodeData: decodedSessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // 2. Update toast yang tadi (menggunakan toastId)
        toast.success('Login Berhasil!', {
          id: toastId,
          description: 'Silakan cek layar komputer Anda.',
        });
        
        setShowLoginQrScanner(false);
        setScannerActive(false);
      } else {
        throw new Error("Gagal");
      }
    } catch (err) {
      // 3. Update toast ke error
      toast.error('Login Gagal', {
        id: toastId,
        description: 'Gagal menghubungkan ke server.',
      });
    }
  };

  function HomePage({ userProfile = { name: 'Ahmad Fauzi', role: 'siswa', kelas: 'XII IPA 2' } }: any) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState<any>({});
    const [emptyFields, setEmptyFields] = useState<string[]>([]);
    const fieldLabels: any = {
      name: 'Nama',
      nis: 'NIS',
      nisn: 'NISN',
      nik: 'NIK',
      gender: 'Jenis Kelamin',
      birthPlace: 'Tempat Lahir',
      birthDate: 'Tanggal Lahir',
      class: 'Kelas',
      batch: 'Angkatan',
      email: 'Email'
    };

    const isFieldEmpty = (field: string) => {
      const value = profileForm[field];

      return (
        value === null ||
        value === undefined ||
        value === '' ||
        value === '-' ||
        value === '0'
      );
    };

    const inputClass = (field: string) => `
      w-full h-12 p-3 rounded text-white placeholder:text-slate-500
      ${isFieldEmpty(field)
        ? 'bg-red-500/10 text-red-200'
        : 'bg-slate-800 border border-transparent'
      }
    `;

    const inputClassLabel = (field: string) => `
      text-xs mb-1
      ${isFieldEmpty(field)
        ? 'text-red-400'
        : 'text-white'
      }
    `;

    const selectedMenu = MENU_ITEMS.find(m => m.id === activeMenu);

    const BASE_URL = 'https://be-school.kiraproject.id'

    // Di dalam komponen HomePage atau sebelum render
    const role = userProfile?.role?.toLowerCase();
    const isSiswa = role === 'siswa';
    // console.log('role', role)

    // Filter MENU_ITEMS berdasarkan role
    const visibleMenuItems = MENU_ITEMS.filter(item => {
      if (isSiswa) {
        // Jika SISWA: hilangkan login-qr
        return item.id !== 'login-qr';
      } else {
        // Jika BUKAN SISWA: hilangkan tugas
        return item.id !== 'tugas';
      }
    });

    // Gunakan visibleMenuItems untuk pencarian
    const filteredMenuItems = visibleMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const requiredFields = [
      'name',
      'nis',
      'nik',
      'gender',
      'birthPlace',
      'birthDate',
      'class',
      'batch',
      'email'
    ];

    const getEmptyFields = (profile: any) => {
      if (!profile) return [];

      return requiredFields.filter((field) => {
        const value = profile[field];

        return (
          value === null ||
          value === undefined ||
          value === '' ||
          value === '-' ||
          value === '0'
        );
      });
    };

    useEffect(() => {
      if (userProfile) {
        const empty = getEmptyFields(userProfile);
        const isSiswa = userProfile.role === 'siswa';
        if (empty.length > 0 && isSiswa) {
          setProfileForm(userProfile);
          setEmptyFields(empty); // ← simpan
          setShowProfileModal(true);
        }
      }
    }, [userProfile]);

    const handleClearSearch = () => {
      setSearchQuery('');
    };

    const handleUpdateProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!profileForm.name || !profileForm.nis || !profileForm.class) {
          alert('Nama | NIS | Kelas wajib diisi.');
          return;
        }

        const payload = {
          name: profileForm.name,
          nis: profileForm.nis,
          nisn: profileForm.nisn,
          nik: profileForm.nik,
          gender: profileForm.gender,
          birthPlace: profileForm.birthPlace,
          birthDate: profileForm.birthDate,
          class: profileForm.class, // ← STRING (contoh: "XII IPA 2")
          batch: profileForm.batch,
          email: profileForm.email
        };

        const res = await axios.put(
          `${BASE_URL}/siswa/${profileForm.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.data.success) {
          const updatedProfile = res.data.data;

          // Update localStorage
          localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

          // Update state profileForm
          setProfileForm(updatedProfile);

          // 🔥 HITUNG ULANG EMPTY FIELDS
          const empty = getEmptyFields(updatedProfile);
          setEmptyFields(empty);

          // 🔥 AUTO CLOSE kalau sudah lengkap
          setShowProfileModal(false);
        }

      } catch (err: any) {
        alert(err.response?.data?.message || 'Gagal update');
      }
    };
  
    return (
      <div className="w-full h-full overflow-auto p-4 md:p-6">

        <Toaster position="top-center" expand={false} richColors />

        {/* ── TOP SEARCH BAR ─────────────────────────── */}
        <HomeHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleClearSearch={handleClearSearch}
          onProfileClick={() => setActiveTab('profile')}
        />
  
        <div className="pt-4 space-y-5">
          <WelcomeBanner userProfile={userProfile} quickStats={QUICK_STATS} />

         {emptyFields.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 p-4">

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 space-y-3">

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-sm font-semibold text-red-300 tracking-wide">
                  Profil belum lengkap
                </p>
              </div>

              <div
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="
                  absolute flex w-6 h-6 p-1 items-center justify-center
                  rounded-md top-0 right-0
                  cursor-pointer active:scale-95
                  bg-red-500/20 hover:bg-red-500/30
                  border border-red-400
                  text-red-300
                  transition-all duration-150
                "
              >
                <Pen />
              </div>

              <p className="text-xs text-slate-400">
                Lengkapi data berikut untuk melanjutkan:
              </p>

              <div className="flex flex-wrap gap-2">
                {emptyFields.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-300 border border-red-500/20"
                  >
                    {fieldLabels[field] || field}
                  </span>
                ))}
              </div>

            </div>
          </div>
        )}

          <ServiceMenuGrid
            filteredMenuItems={filteredMenuItems}
            loadingData={loadingData}
            searchQuery={searchQuery}
            handleClearSearch={handleClearSearch}
            onMenuClick={(id) => setActiveMenu(id)}
            token={token || undefined}
            setShowLoginQrScanner={setShowLoginQrScanner}
            setLoginQrStatus={setLoginQrStatus}
            setScannerActive={setScannerActive}
            setLoginQrMessage={setLoginQrMessage}
          />

          <LatestAnnouncements
            announcements={announcements}
            loading={loadingData.announcements}
            error={errorData.announcements}
            onSelectAnnouncement={setSelectedAnnouncement}
          />
        </div>

        {showProfileModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-2xl p-3 overflow-auto">
            <div className="bg-slate-900 p-4 rounded-2xl w-[100vw] md:max-w-4xl h-max overflow-auto mx-auto flex flex-col space-y-4">

              <h2 className="text-lg font-bold text-left text-white">Lengkapi Profil Siswa</h2>

              <div className="flex-1 grid h-max gap-3">

                {/* Baris 1: Nama & NIS */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('name')}>Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={profileForm.name || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className={inputClass('name')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('nis')}>NIS</label>
                    <input
                      type="text"
                      placeholder="NIS"
                      value={profileForm.nis || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, nis: e.target.value })}
                      className={inputClass('nis')}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className={inputClassLabel('nisn')}>NISN</label>
                    <input
                      type="text"
                      placeholder="NISN"
                      value={profileForm.nisn || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, nisn: e.target.value })}
                      className={inputClass('nisn')}
                    />
                  </div>
                </div>

                {/* Baris 2: NISN & NIK */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('nik')}>NIK</label>
                    <input
                      type="text"
                      placeholder="NIK"
                      value={profileForm.nik || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, nik: e.target.value })}
                      className={inputClass('nik')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('email')}>Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={profileForm.email || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className={inputClass('email')}
                    />
                  </div>
                </div>

                {/* Baris 3: Gender & Tempat Lahir */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('gender')}>Gender</label>
                    <select
                      value={profileForm.gender || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className={inputClass('gender')}
                    >
                      <option value="">Pilih Gender</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className={inputClassLabel('birthPlace')}>Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="Tempat Lahir"
                      value={profileForm.birthPlace || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, birthPlace: e.target.value })}
                      className={inputClass('birthPlace')}
                    />
                  </div>
                </div>

                {/* Baris 4: Tanggal Lahir & Kelas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('birthDate')}>Tanggal Lahir</label>
                    <input
                      type="date"
                      value={profileForm.birthDate || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      className={inputClass('birthDate')}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={inputClassLabel('class')}>Kelas</label>
                    <select
                      value={profileForm.class || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, class: e.target.value })}
                      className={inputClass('class')}
                    >
                      <option value="">Pilih Kelas</option>
                      {loadingClass && <option disabled>Memuat...</option>}
                      {classList.map((kelas) => (
                        <option key={kelas.id} value={kelas.className}>
                          {kelas.className}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Baris 5: Batch / Angkatan & Email */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col">
                    <label className={inputClassLabel('nis')}>Batch / Angkatan</label>
                    <input
                      type="text"
                      placeholder="Batch / Angkatan"
                      value={profileForm.batch || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, batch: e.target.value })}
                      className={inputClass('batch')}
                    />
                  </div>
                </div>

              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 active:scale-[0.97] transition"
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => setSelectedAnnouncement(null)}
            />
            <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl p-6 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black leading-tight">{selectedAnnouncement.title}</h3>
                <button 
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-slate-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content || selectedAnnouncement.deskripsi || 'Detail pengumuman belum tersedia.'}
                </p>
                
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="px-3 py-1 bg-slate-700 rounded-full">
                    {selectedAnnouncement.category || 'Umum'}
                  </span>
                  <span>
                    {format(new Date(selectedAnnouncement.publishDate || selectedAnnouncement.tanggal), 'dd MMMM yyyy', { locale: id })}
                  </span>
                  {selectedAnnouncement.type && (
                    <span className={`px-3 py-1 rounded-full ${selectedAnnouncement.urgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {selectedAnnouncement.type}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-black uppercase tracking-wider transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
  
        {/* ── MODAL MENU ──────────────────────────────── */}
        {activeMenu && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setActiveMenu(null)}
            />
            <div className="relative w-full max-w-lg bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <h3 className="text-lg font-black text-center mb-1">
                {selectedMenu?.label || 'Fitur'}
              </h3>
              <p className="text-xs text-slate-400 text-center mb-6">
                {loadingData[activeMenu!] ? 'Memuat...' : ''}
              </p>

              <div className="max-h-[60vh] overflow-y-auto px-1">
                {activeMenu === 'pengumuman' && (
                  <AnnouncementContent items={announcements} loading={loadingData.announcements} error={errorData.announcements} />
                )}
                {activeMenu === 'berita' && (
                  <NewsContent items={news} loading={loadingData.news} error={errorData.news} />
                )}
                {activeMenu === 'tugas' && (
                  <TugasContent items={tugas} loading={loadingData.tugas} error={errorData.tugas} />
                )}
                {activeMenu === 'kelulusan' && (
                  <KelulusanContent items={alumniData} loading={loadingData.kelulusan} error={errorData.kelulusan} />
                )}
                {activeMenu === 'osis' && (
                  <OsisContent data={osisData} loading={loadingData.osis} error={errorData.osis} />
                )}
                {activeMenu === 'ulasan' && (
                  <UlasanContent 
                    comments={comments} 
                    avgRating={avgRating} 
                    loading={loadingData.ulasan} 
                    error={errorData.ulasan} 
                    schoolId={schoolId}
                    token={token}
                    onCommentAdded={(newComment: any) => setComments(prev => [newComment, ...prev])}
                  />
                )}
              </div>

              <button
                onClick={() => setActiveMenu(null)}
                className="mt-6 w-full py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-black uppercase tracking-widest transition"
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
        {/* Konten tab */}
        {activeTab === 'scan'    && <ScanView status={status} />}
        {activeTab === 'barcode' && (
          <BarcodeView
            userProfile={userProfile}
            barcodeTab={barcodeTab}
            setBarcodeTab={setBarcodeTab}
            downloadBarcode={downloadBarcode}
            printBarcode={printBarcode}
          />
        )}
        {activeTab === 'home'    && <HomePage userProfile={userProfile} />}
        {activeTab === 'history' && (
          <HistoryView history={history} loadingHistory={loadingHistory} />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            classList={classList}
            loadingClass={loadingClass}
            userProfile={userProfile}
            preview={preview}
            form={form}
            setForm={setForm}
            showOldPassword={showOldPassword}
            setShowOldPassword={setShowOldPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            handlePhotoChange={handlePhotoChange}
            handleUpdateProfile={handleUpdateProfile}
            loadingProfile={loadingProfile}
            photoLoading={photoLoading}
          />
        )}

        {/* Bottom navigation */}
        <BottomTabNavigator activeTab={activeTab} setActiveTab={setActiveTab} />
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

      {showLoginQrScanner && (
        <div
          className={`absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-3xl transition-all duration-500 bg-slate-900/95`}
        >
        
          {/* Area scanner */}
          <div className="relative w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border-4 border-slate-500/20 shadow-2xl mb-8">
            {/* Di dalam area scanner Login QR */}
            <div id="login-qr-reader" className="absolute inset-0 w-full h-full bg-slate-900/10" />

            {/* Tampilan awal (idle) - sebelum mulai scan */}
            {loginQrStatus === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-md p-6 text-center">
                <QrCode size={64} className="text-cyan-300 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Siap Memindai</h3>
                <p className="text-slate-400 text-xs mb-8 max-w-sm">
                  Tekan tombol di bawah
                </p>
                <button
                  onClick={() => setScannerActive(true)}
                  className="cursor-pointer px-10 py-5 bg-cyan-500 hover:bg-cyan-600 rounded-2xl text-white font-bold text-lg shadow-xl active:scale-95 transition-transform"
                >
                  Mulai Scan QR
                </button>
              </div>
            )}
          </div>

          {/* Tombol batal */}
          <button
            onClick={() => {
              setShowLoginQrScanner(false);
              setScannerActive(false);
              setLoginQrStatus('idle');
            }}
            className="cursor-pointer text-white hover:text-white/70 text-sm underline active:scale-95 transition"
          >
            Batal / Tutup Scanner
          </button>
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