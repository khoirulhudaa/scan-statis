import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from "react-barcode";
import { Download } from 'lucide-react'; // Tambahkan icon download

const BASE_URL = "https://be-school.kiraproject.id";
// const BASE_URL = "http://localhost:5005";

export default function ScannerPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'scan' | 'barcode'>('scan');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>({
  //   type: 'error',
  //   msg: 'Anda berada di luar jangkauan area sekolah'
  // });
  const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  const token = localStorage.getItem('token');

  const barcodeValue =
    userProfile.role === "siswa"
      ? userProfile.nis
      : userProfile.nip;

  useEffect(() => {
    if (!token) navigate('/', { replace: true });

    // Gunakan Html5Qrcode (bukan Scanner) untuk kontrol penuh tanpa UI
    const html5QrCode = new Html5Qrcode("reader");

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Gunakan kamera belakang
          {
            fps: 24,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Berhasil Scan
            console.log('descode', decodedText)
            html5QrCode.stop().then(() => {
              handleAbsensi(decodedText);
            });
          },
          () => {
            // Scanning... (ignore error pencarian frame)
          }
        );
      } catch (err) {
        console.error("Gagal memulai scanner:", err);
      }
    };

    startScanner();

    // Cleanup saat pindah halaman
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
      }
    };
  }, [navigate, token]);

  useEffect(() => {
    // --- LOGIKA DETEKSI INSTALL PWA ---
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // VERSI SUDAH PRODUCTION
  // const handleAbsensi = async (qrData: string) => {
  //   setStatus({ type: 'loading', msg: 'Syncing...' });
  //   try {
  //       const res = await axios.post(`${BASE_URL}/scan-qr`, 
  //       { qrScanned: qrData }, // Sesuaikan key dengan backend
  //       { headers: { Authorization: `Bearer ${token}` } }
  //       );
        
  //       if (res.data.success) {
  //       setStatus({ type: 'success', msg: res.data.message }); // Gunakan pesan dari backend
  //       }
  //   } catch (err: any) {
  //       setStatus({ type: 'error', msg: err.response?.data?.message || 'Access Denied' });
  //   }
  // };

  const handleAbsensi = async (qrData: string) => {
    setStatus({ type: 'loading', msg: 'Mengambil Lokasi...' });

    // 1. Ambil Koordinat GPS Siswa
    if (!navigator.geolocation) {
      setStatus({ type: 'error', msg: 'Browser tidak mendukung GPS' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setStatus({ type: 'loading', msg: 'Syncing...' });

        try {
          // 2. Kirim data QR + Koordinat ke Backend
          const res = await axios.post(`${BASE_URL}/scan-qr`, 
            { 
              qrCodeData: qrData, // Sesuaikan key dengan backend
              role: userProfile.role === 'siswa' ? 'student' : 'teacher',
              userLat: latitude,
              userLon: longitude
            }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (res.data.success) {
            setStatus({ type: 'success', msg: res.data.message });
          }
        } catch (err: any) {
          // Pesan error dari backend (misal: "Di luar jangkauan") akan tampil di sini
          setStatus({ 
            type: 'error', 
            msg: err.response?.data?.message || 'Gagal melakukan absen' 
          });
        }
      },
      (error) => {
        // Handle jika siswa menolak izin lokasi atau GPS mati
        let errorMsg = 'Gagal mendapatkan lokasi';
        if (error.code === 1) errorMsg = 'Mohon izinkan akses lokasi (GPS)';
        if (error.code === 3) errorMsg = 'Waktu pengambilan lokasi habis (Timeout)';
        
        setStatus({ type: 'error', msg: errorMsg });
      },
      {
        // WAJIB: Agar GPS lebih akurat
        enableHighAccuracy: true, 
        // Maksimal 10 detik menunggu GPS
        timeout: 10000,           
        // Jangan gunakan cache lokasi lama
        maximumAge: 0             
      }
    );
  };

  const logout = () => { localStorage.clear(); navigate('/'); };

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col font-sans relative">

      {/* Tombol Install App (Muncul hanya jika browser mendukung) */}
      {isInstallable && (
        <button 
          onClick={handleInstallClick}
          className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 animate-bounce"
        >
          <Download size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Install App</span>
        </button>
      )}

      {/* Background Grid Minimalis */}
      
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

      {/* Header Profile - Floating */}
      <div className="absolute top-10 left-0 right-0 px-4 md:px-6 z-20 pointer-events-none">
        <div className="w-[100%] md:w-max mx-auto flex items-center bg-slate-900/60 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.05] shadow-2xl pointer-events-auto">
          <div className="flex w-[90%] border-r pr-6 md:pr-12 border-white/10 items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/20">
              {(userProfile.name || userProfile.nama)?.charAt(0)}
            </div>
            <div className="leading-none w-[82%]">
              <h3 className="text-[11px] font-bold w-full truncate uppercase tracking-wider">{userProfile.name || userProfile.nama}</h3>
              <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">{userProfile.role || 'Member'}</p>
            </div>
          </div>
          <div className='flex items-end flex-1 pl-3 md:pl-12'>
            <button onClick={() => setShowLogoutConfirm(true)} className="cursor-pointer flex items-center gap-2 ml-auto text-[10px] font-bold text-red-400 hover:text-red-500 tracking-widest transition-colors uppercase">
              <LogOut size={12} className='md:flex hidden' />
              <LogOut size={20} className='md:hidden flex ml-auto' />
              <span className='md:flex hidden'>
                Keluar
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB MENU */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center z-20">
        <div className="flex gap-4 bg-transparent backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          
          <button
            onClick={() => setActiveTab("scan")}
            className={`px-6 py-2 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold border-r border-white/10 uppercase tracking-wider ${
              activeTab === "scan"
                ? "bg-blue-600 text-white"
                : "text-slate-400"
            }`}
          >
            Scanner
          </button>

          <button
            onClick={handleInstallClick}
            className={`px-6 py-2 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold uppercase tracking-wider ${
            "bg-red-600 text-white"
            }`}
          >
            <Download size={16} />
          </button>

          <button
            onClick={() => setActiveTab("barcode")}
            className={`px-6 py-2 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 border-l border-white/10 font-bold uppercase tracking-wider ${
              activeTab === "barcode"
                ? "bg-blue-500 text-white"
                : "text-slate-400"
            }`}
          >
            Barcode
          </button>
         

        </div>
      </div>
      
      {activeTab === 'scan' && (
        <>
          {/* Main Scanner Section */}
          <div className="flex-1 flex h-screen overflow-hidden items-center justify-center p-0 z-10 relative">
            <div className="relative w-full h-full">
              
              {/* Scanner Brackets UI (Hiasan Siku) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] z-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
                {/* Scanning Line Animation */}
                <div className="w-full h-[1px] bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
              </div>

              {/* Reader Container - Full Screen */}
              <div id="reader" className="w-full h-full bg-black"></div>
              
              {/* Status Overlay */}
              {status && (
                <div className={`absolute h-screen overflow-hidden inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 ${status?.type === 'success' ? 'bg-blue-500' : 'bg-slate-900/95'}`}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/10">
                    {status?.type === 'loading' ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-4xl text-white">{status?.type === 'success' ? <CheckCircle size={60} className='text-white' /> : <AlertCircle size={60} className='text-white' />}</span>
                    )}
                  </div>
                  <p className="font-bold uppercase tracking-[0.2em] text-sm mb-8">{status?.msg}</p>
                  {status?.type !== 'loading' && (
                    <button onClick={() => window.location.reload()} className="bg-white text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Kembali</button>
                  )}
                </div>
              )}

              {/* Status Overlay */}
              {/* {status && (
                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-3xl transition-all duration-500 ${
                  status.type === 'success' ? 'bg-emerald-600/90' : 'bg-red-950/65'
                }`}>
                  
                  <div className="relative mb-8">
                    {status.msg.toLowerCase().includes('jangkauan') && (
                      <div className="absolute inset-0 scale-[2.5] opacity-20">
                        <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-[ping_3s_linear_infinite]"></div>
                      </div>
                    )}
                    
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center relative z-10 shadow-2xl ${
                      status.type === 'success' ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'
                    }`}>
                      {status.type === 'loading' ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : status.type === 'success' ? (
                        <CheckCircle size={48} strokeWidth={3} />
                      ) : (
                        <AlertCircle size={48} strokeWidth={3} />
                      )}
                    </div>
                  </div>

                  <div className="max-w-xs mx-auto">
                    <h2 className={`text-xl font-black uppercase tracking-tighter mb-2 ${
                      status.type === 'success' ? 'text-white' : 'text-red-500'
                    }`}>
                      {status.type === 'success' ? 'Absensi Berhasil' : 'Akses Ditolak'}
                    </h2>
                    
                    <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8">
                      {status.msg}
                    </p>

                    {status.msg.toLowerCase().includes('jangkauan') && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Radius Terdeteksi</p>
                          <p className="text-xs text-white font-bold">Silahkan mendekat ke area sekolah untuk melakukan presensi.</p>
                        </div>
                      </div>
                    )}

                    {status.type !== 'loading' && (
                      <button 
                        onClick={() => window.location.reload()} 
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-transform active:scale-95 ${
                          status.type === 'success' 
                          ? 'bg-white text-emerald-600' 
                          : 'bg-red-500 text-white shadow-red-500/20'
                        }`}
                      >
                        Coba Lagi
                      </button>
                    )}
                  </div>
                </div>
              )} */}

              <div className="absolute bottom-12 left-0 right-0 text-center z-20 pointer-events-none">
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Active</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "barcode" && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black z-10 relative">

          <p className="text-white text-sm uppercase tracking-widest mb-6">
            {userProfile.role === "siswa" ? "Barcode NIS" : "Barcode NIP"}
          </p>

          <div className="bg-white p-6 rounded-xl">
            <Barcode
              value={barcodeValue || "000000"}
              height={120}
              width={3}
              fontSize={18}
              margin={10}
            />
          </div>

        </div>
      )}

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowLogoutConfirm(false)} 
          />
          
          {/* Card Modal */}
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













// import axios from 'axios';
// import { Html5Qrcode } from 'html5-qrcode';
// import { AlertCircle, CheckCircle, LogOut } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const BASE_URL = "https://be-school.kiraproject.id";

// export default function ScannerPage() {
//   const navigate = useNavigate();
//   const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
  
//   const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     if (!token) navigate('/', { replace: true });

//     const html5QrCode = new Html5Qrcode("reader");

//     const startScanner = async () => {
//       try {
//         await html5QrCode.start(
//           { facingMode: "environment" },
//           {
//             fps: 24,
//             qrbox: { width: 250, height: 250 },
//             aspectRatio: 1.0
//           },
//           (decodedText) => {
//             // Berhasil Scan -> Langsung jalankan fungsi absensi
//             html5QrCode.stop().then(() => {
//               handleAbsensi(decodedText);
//             });
//           },
//           () => {} // Ignore scan errors (frame searching)
//         );
//       } catch (err) {
//         console.error("Gagal memulai scanner:", err);
//       }
//     };

//     startScanner();

//     return () => {
//       if (html5QrCode.isScanning) {
//         html5QrCode.stop().catch(err => console.error(err));
//       }
//     };
//   }, [navigate, token]);

//   const handleAbsensi = async (qrData: string) => {
//     setStatus({ type: 'loading', msg: 'Syncing...' });

//     try {
//       // PROSES INSTAN: Tanpa menunggu Geolocation
//       const res = await axios.post(`${BASE_URL}/scan-qr`, 
//         { 
//           qrCodeData: qrData,
//           role: userProfile.role === 'siswa' ? 'student' : 'teacher',
//           userLat: 0, // Bypass koordinat
//           userLon: 0
//         }, 
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       if (res.data.success) {
//         setStatus({ type: 'success', msg: res.data.message });
//       }
//     } catch (err: any) {
//       setStatus({ 
//         type: 'error', 
//         msg: err.response?.data?.message || 'Gagal melakukan absen' 
//       });
//     }
//   };

//   return (
//     <div className="h-screen bg-[#020617] text-white flex flex-col font-sans relative">
//       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

//       <div className="flex-1 flex h-screen overflow-hidden items-center justify-center p-0 z-10 relative">
//         <div className="relative w-full h-full">
          
//           {/* Header Profile */}
//           <div className="absolute top-10 left-0 right-0 px-4 md:px-6 z-20 pointer-events-none">
//             <div className="w-[100%] md:w-max mx-auto flex items-center bg-slate-900/60 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.05] shadow-2xl pointer-events-auto">
//               <div className="flex w-[90%] border-r pr-6 md:pr-12 border-white/10 items-center gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/20 text-white">
//                   {(userProfile.name || userProfile.nama)?.charAt(0)}
//                 </div>
//                 <div className="leading-none w-[82%]">
//                   <h3 className="text-[11px] font-bold w-full truncate uppercase tracking-wider">{userProfile.name || userProfile.nama}</h3>
//                   <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">{userProfile.role || 'Member'}</p>
//                 </div>
//               </div>
//               <div className='flex items-end flex-1 pl-3 md:pl-12'>
//                 <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-2 ml-auto text-[10px] font-bold text-red-400 hover:text-red-500 tracking-widest transition-colors uppercase">
//                   <LogOut size={20} />
//                   <span className='md:flex hidden'>Keluar</span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Scanner UI Brackets */}
//           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] z-20 pointer-events-none">
//             <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
//             <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
//             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
//             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
//             <div className="w-full h-[1px] bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
//           </div>

//           <div id="reader" className="w-full h-full bg-black"></div>
          
//           {/* Status Overlay */}
//           {status && (
//             <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 ${status.type === 'success' ? 'bg-blue-600/90' : 'bg-slate-900/95'}`}>
//               <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/10">
//                 {status.type === 'loading' ? (
//                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                 ) : (
//                    <span className="text-white">
//                      {status.type === 'success' ? <CheckCircle size={60} /> : <AlertCircle size={60} />}
//                    </span>
//                 )}
//               </div>
//               <h2 className="text-xl font-black uppercase mb-2 tracking-widest">
//                 {status.type === 'success' ? 'Berhasil' : 'Gagal'}
//               </h2>
//               <p className="font-medium text-slate-200 text-sm mb-8">{status.msg}</p>
//               {status.type !== 'loading' && (
//                 <button 
//                   onClick={() => window.location.reload()} 
//                   className="bg-white text-blue-600 px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-transform"
//                 >
//                   Kembali
//                 </button>
//               )}
//             </div>
//           )}

//           <div className="absolute bottom-12 left-0 right-0 text-center z-20 pointer-events-none">
//              <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Mode: Global</p>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         #reader video {
//           width: 100% !important;
//           height: 100% !important;
//           object-fit: cover !important;
//         }
//         @keyframes scan {
//           0% { top: 0; opacity: 0; }
//           50% { opacity: 1; }
//           100% { top: 100%; opacity: 0; }
//         }
//       `}</style>
//     </div>
//   );
// }