// import axios from 'axios';
// import { Html5Qrcode } from 'html5-qrcode';
// import { AlertCircle, BarcodeIcon, CheckCircle, ClipboardList, Download, Eye, EyeOff, ListX, LogOut, Printer, ScanIcon, User } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import Barcode from "react-barcode";
// import { useNavigate } from 'react-router-dom';
// import { toast, Toaster } from 'sonner';

// const BASE_URL = "https://be-school.kiraproject.id";

// // let cachedDeferredPrompt: any = null;

// // window.addEventListener('beforeinstallprompt', (e) => {
// //   e.preventDefault();
// //   cachedDeferredPrompt = e;
// // });

// export default function ScannerPage() {
//   const navigate = useNavigate();
//   // const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
//   // const [isInstallable, setIsInstallable] = useState(false);
//   const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading', msg: string } | null>(null);
//   const [activeTab, setActiveTab] = useState<'scan' | 'barcode' | 'history' | 'profile'>('scan');
//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
//   const [barcodeTab, setBarcodeTab] = useState<'nis' | 'nisn'>('nis');
//   const [history, setHistory] = useState<any[]>([]);
//   const [loadingHistory, setLoadingHistory] = useState(false);
//   const [showOldPassword, setShowOldPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [form, setForm] = useState<any>({
//     name: '',
//     email: '',
//     nis: '',
//     nisn: '',
//     nip: '',
//     oldPassword: '',
//     newPassword: ''
//   });
//   const [loadingProfile, setLoadingProfile] = useState(false);
//   const [photoLoading, setPhotoLoading] = useState(false);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [userProfile, setUserProfile] = useState<any>(() => {
//     return JSON.parse(localStorage.getItem('user_profile') || '{}');
//   });

//   // const userProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     if (!token) navigate('/', { replace: true });

//     // Gunakan Html5Qrcode (bukan Scanner) untuk kontrol penuh tanpa UI
//     const html5QrCode = new Html5Qrcode("reader");

//     const startScanner = async () => {
//       try {
//         await html5QrCode.start(
//           { facingMode: "environment" }, // Gunakan kamera belakang
//           {
//             fps: 24,
//             qrbox: { width: 250, height: 250 },
//             aspectRatio: 1.0
//           },
//           (decodedText) => {
//             // Berhasil Scan
//             console.log('descode', decodedText)
//             html5QrCode.stop().then(() => {
//               handleAbsensi(decodedText);
//             });
//           },
//           () => {
//             // Scanning... (ignore error pencarian frame)
//           }
//         );
//       } catch (err) {
//         console.error("Gagal memulai scanner:", err);
//       }
//     };

//     startScanner();

//     // Cleanup saat pindah halaman
//     return () => {
//       if (html5QrCode.isScanning) {
//         html5QrCode.stop().catch(err => console.error(err));
//       }
//     };
//   }, [navigate, token]);

//   // useEffect(() => {
//   //     // 1. Cek apakah event sudah tertangkap di variabel global
//   //     if (cachedDeferredPrompt) {
//   //       setDeferredPrompt(cachedDeferredPrompt);
//   //       setIsInstallable(true);
//   //     }

//   //     // 2. Listener untuk menangkap event jika terjadi setelah mount
//   //     const handleBeforeInstallPrompt = (e: any) => {
//   //       e.preventDefault();
//   //       setDeferredPrompt(e);
//   //       setIsInstallable(true);
//   //     };

//   //     window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

//   //     // 3. Listener tambahan: Jika aplikasi berhasil diinstall, sembunyikan tombol
//   //     const handleAppInstalled = () => {
//   //       setIsInstallable(false);
//   //       setDeferredPrompt(null);
//   //       cachedDeferredPrompt = null;
//   //     };

//   //     window.addEventListener('appinstalled', handleAppInstalled);

//   //     return () => {
//   //       window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
//   //       window.removeEventListener('appinstalled', handleAppInstalled);
//   //     };
//   //   }, []);

//     useEffect(() => {
//       setForm({
//         name: userProfile.name || userProfile.nama || '',
//         email: userProfile.email || '',
//         nis: userProfile.nis || '',
//         nisn: userProfile.nisn || '',
//         nip: userProfile.nip || ''
//       });
//     }, []);

//     const handleUpdateProfile = async () => {
//       try {
//         setLoadingProfile(true);

//         if (form.newPassword && !form.oldPassword) {
//           toast.error('Masukkan password lama terlebih dahulu');
//           return;
//         }

//         const res = await axios.put(
//           `${BASE_URL}/profile/me/biodata`,
//           form,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         if (res.data.success) {
//           const oldProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');

//           const updatedProfile = { 
//             ...oldProfile, 
//             ...(res.data.data || form)
//           };

//           // ✅ update localStorage
//           localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

//           // ✅ update state (INI YANG PENTING)
//           setUserProfile(updatedProfile);
//           setForm({
//             name: updatedProfile.name || updatedProfile.nama || '',
//             email: updatedProfile.email || '',
//             nis: updatedProfile.nis || '',
//             nisn: updatedProfile.nisn || '',
//             nip: updatedProfile.nip || '',
//           });

//           toast.success('Profil berhasil diperbarui!');
//         }
//       } catch (err: any) {
//         toast.error(err.response?.data?.message || 'Gagal update profil');
//       } finally {
//         setLoadingProfile(false);
//       }
//     };

//     const handlePhotoChange = async (e: any) => {
//       const file = e.target.files[0];
//       if (!file) return;

//       setPreview(URL.createObjectURL(file));

//       const formData = new FormData();
//       formData.append('photo', file);

//       try {
//         setPhotoLoading(true);

//         const res = await axios.post(
//           `${BASE_URL}/profile/me/photo`,
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'multipart/form-data'
//             }
//           }
//         );

//         if (res.data.success) {
//           const oldProfile = JSON.parse(localStorage.getItem('user_profile') || '{}');

//           const updatedProfile = { 
//             ...oldProfile, 
//             ...(res.data.data || form) // fallback ke form
//           };

//           localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

//           toast.success('Foto profil berhasil diperbarui!', { id: 'upload-photo' });
          
//           // setTimeout(() => {
//           //   window.location.reload();
//           // }, 1500);
//         }
//       } catch (err: any) {
//         toast.error(err.response?.data?.message || 'Gagal upload');
//       } finally {
//         setPhotoLoading(false);
//       }
//     };
    
//     // Fungsi ambil data dari backend
//     const fetchHistory = async () => {
//       setLoadingHistory(true);
//       try {
//         const res = await axios.get(`${BASE_URL}/siswa/get-attendances`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.data.success) setHistory(res.data.data);
//       } catch (err) {
//         console.error("Gagal ambil history");
//       } finally {
//         setLoadingHistory(false);
//       }
//     };

//     // Panggil fetch saat tab history diklik
//     useEffect(() => {
//       if (activeTab === 'history') fetchHistory();
//     }, [activeTab]);

//   // const handleInstallClick = async () => {
//   //   if (!deferredPrompt) return;
//   //   deferredPrompt.prompt();
//   //   const { outcome } = await deferredPrompt.userChoice;
//   //   if (outcome === 'accepted') {
//   //     setIsInstallable(false);
//   //   }
//   //   setDeferredPrompt(null);
//   // };

//   const handleAbsensi = async (qrData: string) => {
//     setStatus({ type: 'loading', msg: 'Mengambil Lokasi...' });

//     // 1. Ambil Koordinat GPS Siswa
//     if (!navigator.geolocation) {
//       setStatus({ type: 'error', msg: 'Browser tidak mendukung GPS' });
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
        
//         setStatus({ type: 'loading', msg: 'Syncing...' });

//         try {
//           // 2. Kirim data QR + Koordinat ke Backend
//           const res = await axios.post(`${BASE_URL}/scan-qr`, 
//             { 
//               qrCodeData: qrData, // Sesuaikan key dengan backend
//               role: userProfile.role === 'siswa' ? 'student' : 'teacher',
//               userLat: latitude,
//               userLon: longitude
//             }, 
//             { headers: { Authorization: `Bearer ${token}` } }
//           );
          
//           if (res.data.success) {
//             setStatus({ type: 'success', msg: res.data.message });
//           }
//         } catch (err: any) {
//           // Pesan error dari backend (misal: "Di luar jangkauan") akan tampil di sini
//           setStatus({ 
//             type: 'error', 
//             msg: err.response?.data?.message || 'Gagal melakukan absen' 
//           });
//         }
//       },
//       (error) => {
//         // Handle jika siswa menolak izin lokasi atau GPS mati
//         let errorMsg = 'Gagal mendapatkan lokasi';
//         if (error.code === 1) errorMsg = 'Mohon izinkan akses lokasi (GPS)';
//         if (error.code === 3) errorMsg = 'Waktu pengambilan lokasi habis (Timeout)';
        
//         setStatus({ type: 'error', msg: errorMsg });
//       },
//       {
//         // WAJIB: Agar GPS lebih akurat
//         enableHighAccuracy: true, 
//         // Maksimal 10 detik menunggu GPS
//         timeout: 10000,           
//         // Jangan gunakan cache lokasi lama
//         maximumAge: 0             
//       }
//     );
//   };

//   const logout = () => { localStorage.clear(); navigate('/'); };

//   // --- FUNGSI BARU: DOWNLOAD BARCODE ---
//   const downloadBarcode = () => {
//     const canvas = document.querySelector("#barcode-container canvas") as HTMLCanvasElement;
//     if (canvas) {
//       const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
//       let downloadLink = document.createElement("a");
//       downloadLink.href = pngUrl;
//       downloadLink.download = `barcode-${barcodeTab}-${userProfile.nis || userProfile.nip}.png`;
//       document.body.appendChild(downloadLink);
//       downloadLink.click();
//       document.body.removeChild(downloadLink);
//     }
//   };

//   // --- FUNGSI BARU: PRINT BARCODE ---
//   const printBarcode = () => {
//     const canvas = document.querySelector("#barcode-container canvas") as HTMLCanvasElement;
//     if (canvas) {
//       const dataUrl = canvas.toDataURL();
//       const windowContent = `
//         <!DOCTYPE html>
//         <html>
//         <head><title>Print Barcode</title></head>
//         <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
//           <h3>${userProfile.name || userProfile.nama}</h3>
//           <p style="text-transform:uppercase; font-size:12px; margin-bottom:20px;">${barcodeTab.toUpperCase()}: ${userProfile.role === 'siswa' ? (barcodeTab === 'nis' ? userProfile.nis : userProfile.nisn) : userProfile.nip}</p>
//           <img src="${dataUrl}" style="width:300px;"/>
//           <script>window.onload = () => { window.print(); window.close(); }</script>
//         </body>
//         </html>
//       `;
//       const printWin = window.open('', '', 'width=600,height=600');
//       printWin?.document.open();
//       printWin?.document.write(windowContent);
//       printWin?.document.close();
//     }
//   };

//   return (
//     <div className="h-screen bg-[#020617] text-white flex flex-col font-sans relative">

//       <Toaster position="top-right" richColors />
//       {/* Background Grid Minimalis */}
      
//       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

//       {/* Header Profile - Floating */}
//       <div className="absolute top-0 md:top-9 left-0 right-0 px-0 md:px-6 z-20 pointer-events-none">
//         <div className="w-screen md:w-[34vw] mx-auto flex items-center bg-slate-900/60 backdrop-blur-xl px-5 md:px-3 py-4 md:py-3 md:rounded-2xl border border-white/[0.05] shadow-2xl pointer-events-auto">
//           <div className="flex w-[90%] border-r pr-6 md:pr-12 border-white/10 items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/20">
//               {(userProfile.name || userProfile.nama)?.charAt(0)}
//             </div>
//             <div className="leading-none w-[82%]">
//               <h3 className="text-[11px] font-bold w-full truncate uppercase tracking-wider">{userProfile.name || userProfile.nama}</h3>
//               <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">{userProfile.role || 'Member'}</p>
//             </div>
//           </div>
//           <div className='flex items-end flex-1 pl-3 md:pl-12'>
//             <button onClick={() => setShowLogoutConfirm(true)} className="cursor-pointer flex items-center gap-2 ml-auto text-[10px] font-bold text-red-400 hover:text-red-500 tracking-widest transition-colors uppercase">
//               <LogOut size={12} className='md:flex hidden' />
//               <LogOut size={20} className='md:hidden flex ml-auto' />
//               <span className='md:flex hidden'>
//                 Keluar
//               </span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* TAB MENU */}
//       <div className="fixed bottom-0 w-screen left-0 right-0 flex justify-center z-20">
//         <div className="w-full md:w-max grid grid-cols-4 bg-slate-900/60 backdrop-blur-xl shadow-2xl  md:border border-white/10 overflow-hidden">
          
//           <button
//             onClick={() => setActiveTab("scan")}
//             className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
//               activeTab === "scan"
//                 ? "text-blue-500"
//                 : "text-slate-500"
//             }`}
//           >
//             <ScanIcon size={18.5} />
//             <p>Scan</p>
//           </button>

//           <button
//             onClick={() => setActiveTab("history")}
//             className={`px-6 py-2.5 text-xs cursor-pointer gap-2 text-center flex flex-col justify-center items-center font-bold ber-black/30 ${
//               activeTab === "history" ? "text-blue-500" : "text-slate-500"
//             }`}
//           >
//             <ClipboardList size={18.5} />
//             <p>Riwayat</p>
//           </button>

//           <button
//             onClick={() => setActiveTab("profile")}
//             className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
//               activeTab === "profile"
//                 ? "text-blue-500"
//                 : "text-slate-500"
//             }`}
//           >
//             <User size={18.5} />
//             <p>Profile</p>
//           </button>
          
//           {/* {
//             isInstallable && (
//               <button
//                 onClick={handleInstallClick}
//                 className={`px-6 py-2 w-full flex flex-col items-center gap-2 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
//                 "text-slate-500"
//                 }`}
//               >
//                 <Download size={18.5} />
//                 <p>Unduh</p>
//               </button>
//             )
//           } */}

//           <button
//             onClick={() => setActiveTab("barcode")}
//             className={`w-full flex flex-col text-center justify-center items-center gap-2 px-6 py-2.5 text-xs cursor-pointer active:scale-[0.97] hover:brightness-85 font-bold tracking-wider ${
//               activeTab === "barcode"
//                 ? "text-blue-500"
//                 : "text-slate-500"
//             }`}
//           >
//             <BarcodeIcon size={18.5} />
//             <p>Barcode</p>
//           </button>
         

//         </div>
//       </div>
      
//       {activeTab === 'scan' && (
//         <>
//           {/* Main Scanner Section */}
//           <div className="flex-1 flex h-screen overflow-hidden items-center justify-center p-0 z-10 relative">
//             <div className="relative w-full h-full">
              
//               {/* Scanner Brackets UI (Hiasan Siku) */}
//               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] z-20 pointer-events-none">
//                 <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-xl"></div>
//                 <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-xl"></div>
//                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-xl"></div>
//                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-xl"></div>
//                 {/* Scanning Line Animation */}
//                 <div className="w-full h-[1px] bg-blue-500/50 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
//               </div>

//               {/* Reader Container - Full Screen */}
//               <div id="reader" className="w-full h-full bg-black"></div>
              
//               {/* Status Overlay */}
//               {status && (
//                 <div className={`absolute h-screen overflow-hidden inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 ${status?.type === 'success' ? 'bg-blue-500' : 'bg-slate-900/95'}`}>
//                   <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-white/10">
//                     {status?.type === 'loading' ? (
//                       <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     ) : (
//                       <span className="text-4xl text-white">{status?.type === 'success' ? <CheckCircle size={60} className='text-white' /> : <AlertCircle size={60} className='text-white' />}</span>
//                     )}
//                   </div>
//                   <p className="font-bold uppercase tracking-[0.2em] text-sm mb-8">{status?.msg}</p>
//                   {status?.type !== 'loading' && (
//                     <button onClick={() => window.location.reload()} className="cursor-pointer active:scale-[0.97] hover:brightness-80 bg-white text-black px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl">Kembali</button>
//                   )}
//                 </div>
//               )}

//               <div className="absolute top-36 left-0 right-0 text-center z-20 pointer-events-none">
//                 <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Active</p>
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {activeTab === "barcode" && (
//         <div className="w-full overflow-hidden h-full flex flex-col items-center justify-center bg-black z-10 relative">

//           {/* TAB BARCODE KHUSUS SISWA */}
//           {userProfile.role === "siswa" && (
//             <div className="flex mb-10 border border-white/10 rounded-xl overflow-hidden">
//               <button
//                 onClick={() => setBarcodeTab("nis")}
//                 className={`cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider ${
//                   barcodeTab === "nis" ? "bg-blue-600 text-white" : "text-slate-400"
//                 }`}
//               >
//                 NIS
//               </button>

//               <button
//                 onClick={() => setBarcodeTab("nisn")}
//                 className={`cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider ${
//                   barcodeTab === "nisn" ? "bg-blue-600 text-white" : "text-slate-400"
//                 }`}
//               >
//                 NISN
//               </button>
//               <button
//                 onClick={downloadBarcode}
//                 className={`cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400`}
//               >
//                 <Download size={19} />
//               </button>
//               <button
//                 onClick={printBarcode}
//                 className={`cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400`}
//               >
//                 <Printer size={17.5} />
//               </button>
//             </div>
//           )}

//           <p className="text-white text-sm uppercase tracking-widest mb-6">
//             {userProfile.role === "siswa"
//               ? `Barcode ${barcodeTab.toUpperCase()}`
//               : "Barcode NIP"}
//           </p>

//           <div id="barcode-container" className="bg-white p-6 md:scale-[1] scale-[0.9] rounded-xl">
//             <Barcode
//               value={
//                 userProfile.role === "siswa"
//                   ? barcodeTab === "nis"
//                     ? userProfile.nis
//                     : userProfile.nisn
//                   : userProfile.nip
//               }
//               height={90}
//               width={2.5}
//               renderer="canvas"
//               fontSize={18}
//               margin={10}
//             />
//           </div>

//         </div>
//       )}

//       {activeTab === "history" && (
//         <div className={`w-full md:w-sm h-[51vh] flex mx-auto justify-start items-center flex-col mt-40 px-6 z-10 ${history.length > 1 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          
//           {loadingHistory ? (
//             <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
//           ) : (
//             <div className="w-full flex flex-col gap-3 pb-10">
//               {history.length > 0 ? history.map((item, i) => (
//                 <div key={i} className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
//                   <div>
//                     <p className="text-[10px] text-slate-500 uppercase font-bold">{item.date}</p>
//                     <p className="text-xs font-bold mt-1">{item.time} WIB</p>
//                   </div>
//                   <div className="text-right">
//                     <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${item.isLate ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-400'}`}>
//                       {item.isLate ? 'Terlambat' : item.status}
//                     </span>
//                   </div>
//                 </div>
//               )) : (
//                 <div className='w-full flex flex-col py-32 justify-center items-center text-center h-max'>
//                   <ListX className='text-slate-300 mb-10' size={28} />
//                   <p className="text-center text-slate-500 text-md">Belum ada data kehadiran bulan ini</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}

//       {/* MODAL KONFIRMASI LOGOUT */}
//       {showLogoutConfirm && (
//         <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-6">
//           {/* Backdrop */}
//           <div 
//             className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
//             onClick={() => setShowLogoutConfirm(false)} 
//           />
          
//           {/* Card Modal */}
//           <div className="relative w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
//             <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <LogOut size={32} />
//             </div>
            
//             <h3 className="text-lg font-bold dark:text-white mb-2">Konfirmasi Keluar</h3>
//             <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
//               Apakah Anda yakin ingin keluar dari akun ini? Anda perlu masuk kembali nanti.
//             </p>
            
//             <div className="flex flex-col gap-3">
//               <button 
//                 onClick={logout} 
//                 className="cursor-pointer hover:brightness-85 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 active:scale-[0.97] transition-all"
//               >
//                 Ya, Keluar Sekarang
//               </button>
//               <button 
//                 onClick={() => setShowLogoutConfirm(false)} 
//                 className="cursor-pointer hover:brightness-85 w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-[0.97] transition-all"
//               >
//                 Batal
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {activeTab === "profile" && (
//         <div className="w-full h-full flex flex-col items-center justify-start pt-30 px-4 z-10 overflow-y-auto pb-32">
//           {/* Card Container - Lebih ramping dengan max-w-sm */}
//           <div className="w-full md:max-w-[32vw] md:scale-[0.9] bg-slate-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-white/10 shadow-xl">
            
//             {/* SECTION: FOTO - Ukuran diperkecil */}
//             <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
//               <div className="relative group">
//                 <img
//                   src={preview || userProfile.photoUrl || 'https://via.placeholder.com/150'}
//                   className="w-14 h-14 rounded-2xl object-cover border border-white/10"
//                   alt="Profile"
//                 />
//                 <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-500 transition-colors">
//                   <Download size={12} className="text-white rotate-180" />
//                   <input type="file" className="hidden" onChange={handlePhotoChange} />
//                 </label>
//               </div>
//               <div>
//                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Profil Pengguna</h4>
//                 <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{userProfile.role || 'Member'}</p>
//               </div>
//             </div>

//             {/* SECTION: FORM - Lebih Padat */}
//             <div className="flex flex-col gap-3">
//               {/* Name Input */}
//               <div className="group">
//                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Nama</p>
//                 <input
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
//                   placeholder="Nama Lengkap"
//                 />
//               </div>

//               {/* Email Input */}
//               <div className="group">
//                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Email</p>
//                 <input
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
//                   placeholder="Email Sekolah"
//                 />
//               </div>

//               {/* Password Lama */}
//               <div className="relative group w-full">
//                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Password Lama</p>
//                 <input
//                   type={showOldPassword ? "text" : "password"}
//                   value={form.oldPassword || ''}
//                   onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
//                   className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
//                   placeholder="Masukkan password lama"
//                 />
//                   <button
//                   type="button"
//                   onClick={() => setShowOldPassword(!showOldPassword)}
//                   className="absolute right-3 top-[30px] cursor-pointer hover:brightness-75 active:scale-[0.98] text-slate-400 hover:text-white"
//                 >
//                   {showOldPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//                 </button>
//               </div>

//               {/* Password Baru */}
//               <div className="relative group w-full">
//                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Password Baru</p>
//                 <input
//                   type={showNewPassword ? "text" : "password"}
//                   value={form.newPassword || ''}
//                   onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
//                   className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
//                   placeholder="Masukkan password baru"
//                 />
//                   <button
//                     type="button"
//                     onClick={() => setShowNewPassword(!showNewPassword)}
//                     className="absolute right-3 top-[30px] cursor-pointer hover:brightness-75 active:scale-[0.98] text-slate-400 hover:text-white"
//                   >
//                     {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
//                   </button>
//               </div>

//               {/* Identitas Row */}
//               <div className="grid grid-cols-2 gap-3">
//                 {userProfile.role === 'siswa' ? (
//                   <>
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NIS</p>
//                       <input
//                         value={form.nis}
//                         onChange={(e) => setForm({ ...form, nis: e.target.value })}
//                         className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
//                       />
//                     </div>
//                     <div>
//                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NISN</p>
//                       <input
//                         value={form.nisn}
//                         onChange={(e) => setForm({ ...form, nisn: e.target.value })}
//                         className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
//                       />
//                     </div>
//                   </>
//                 ) : (
//                   <div className="col-span-2">
//                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NIP</p>
//                     <input
//                       value={form.nip}
//                       onChange={(e) => setForm({ ...form, nip: e.target.value })}
//                       className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
//                     />
//                   </div>
//                 )}
//               </div>

//               <button
//                 onClick={handleUpdateProfile}
//                 disabled={loadingProfile || photoLoading} // Tombol mati jika salah satu proses jalan
//                 className="mt-2 w-full py-3 cursor-pointer active:scale-95 hover:bg-blue-800 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
//               >
//                 {(loadingProfile || photoLoading) ? (
//                   <>
//                     <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">
//                       {photoLoading ? "Mengunggah Data..." : "Memproses..."}
//                     </span>
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle size={14} />
//                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">Update Profil</span>
//                   </>
//                 )}
//               </button>
//             </div>

//           </div>
//         </div>
//       )}

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





import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertCircle,
  BarcodeIcon,
  CheckCircle,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  ListX,
  LogOut,
  Printer,
  ScanIcon,
  User,
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
  const [activeTab, setActiveTab] = useState<'scan' | 'barcode' | 'history' | 'profile'>('scan');
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
            fps: 30,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            console.log('Scanned QR:', decodedText);
            html5QrCode.stop().then(() => {
              handleScanResult(decodedText);
            });
          },
          () => {} // ignore scan errors
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

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col font-sans relative">
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
      <div className="absolute top-0 md:top-9 left-0 right-0 px-0 md:px-6 z-20 pointer-events-none">
        <div className="w-screen md:w-[34vw] mx-auto flex items-center bg-slate-900/60 backdrop-blur-xl px-5 md:px-3 py-4 md:py-3 md:rounded-2xl border border-white/[0.05] shadow-2xl pointer-events-auto">
          <div className="flex w-[90%] border-r pr-6 md:pr-12 border-white/10 items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-500/20">
              {(userProfile.name || userProfile.nama)?.charAt(0) || '?'}
            </div>
            <div className="leading-none w-[82%]">
              <h3 className="text-[11px] font-bold w-full truncate uppercase tracking-wider">
                {userProfile.name || userProfile.nama || 'User'}
              </h3>
              <p className="text-[9px] text-slate-500 mt-1 uppercase font-medium">
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

      {/* Tab Menu Bottom */}
      <div className="fixed bottom-0 w-screen left-0 right-0 flex justify-center z-20">
        <div className="w-full md:w-max grid grid-cols-4 bg-slate-900/60 backdrop-blur-xl shadow-2xl md:border border-white/10 overflow-hidden">
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

      {/* Konten sesuai tab */}
      {activeTab === 'scan' && (
        <div className="flex-1 flex h-screen overflow-hidden items-center justify-center p-0 z-10 relative">
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

            <div className="absolute top-36 left-0 right-0 text-center z-20 pointer-events-none">
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.6em]">Scanner Active</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'barcode' && (
        <div className="w-full overflow-hidden h-full flex flex-col items-center justify-center bg-black z-10 relative">
          {userProfile.role === 'siswa' && (
            <div className="flex mb-10 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setBarcodeTab('nis')}
                className={`cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider ${
                  barcodeTab === 'nis' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                NIS
              </button>
              <button
                onClick={() => setBarcodeTab('nisn')}
                className={`cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider ${
                  barcodeTab === 'nisn' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                NISN
              </button>
              <button
                onClick={downloadBarcode}
                className="cursor-pointer hover:bg-white/10 border-r border-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                <Download size={19} />
              </button>
              <button
                onClick={printBarcode}
                className="cursor-pointer hover:bg-white/10 active:scale-[0.98] px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                <Printer size={17.5} />
              </button>
            </div>
          )}

          <p className="text-white text-sm uppercase tracking-widest mb-6">
            {userProfile.role === 'siswa' ? `Barcode ${barcodeTab.toUpperCase()}` : 'Barcode NIP'}
          </p>

          <div id="barcode-container" className="bg-white p-6 md:scale-[1] scale-[0.9] rounded-xl">
            <Barcode
              value={
                userProfile.role === 'siswa'
                  ? barcodeTab === 'nis'
                    ? userProfile.nis
                    : userProfile.nisn
                  : userProfile.nip
              }
              height={90}
              width={2.5}
              renderer="canvas"
              fontSize={18}
              margin={10}
            />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div
          className={`w-full md:w-sm h-[51vh] flex mx-auto justify-start items-center flex-col mt-40 px-6 z-10 ${
            history.length > 1 ? 'overflow-y-auto' : 'overflow-hidden'
          }`}
        >
          {loadingHistory ? (
            <div className="flex justify-center p-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3 pb-10">
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
                <div className="w-full flex flex-col py-32 justify-center items-center text-center h-max">
                  <ListX className="text-slate-300 mb-10" size={28} />
                  <p className="text-center text-slate-500 text-md">Belum ada data kehadiran bulan ini</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

      {activeTab === 'profile' && (
        <div className="w-full h-full flex flex-col items-center justify-start pt-30 px-4 z-10 overflow-y-auto pb-32">
          <div className="w-full md:max-w-[32vw] md:scale-[0.9] bg-slate-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-white/10 shadow-xl">
            <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
              <div className="relative group">
                <img
                  src={preview || userProfile.photoUrl || 'https://via.placeholder.com/150'}
                  className="w-14 h-14 rounded-2xl object-cover border border-white/10"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="group">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Email</p>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
                  placeholder="Email Sekolah"
                />
              </div>

              <div className="relative group w-full">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Password Lama</p>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={form.oldPassword || ''}
                  onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
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
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NISN</p>
                      <input
                        value={form.nisn}
                        onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">NIP</p>
                    <input
                      value={form.nip}
                      onChange={(e) => setForm({ ...form, nip: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={loadingProfile || photoLoading}
                className="mt-2 w-full py-3 cursor-pointer active:scale-95 hover:bg-blue-800 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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