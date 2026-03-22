import axios from 'axios';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Mail, QrCode } from 'lucide-react';

const BASE_URL = "https://be-school.kiraproject.id";

export default function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru' | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'qr'>('email');

  // Email login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR states
  const [scanning, setScanning] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  // Maintenance modal states
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  // Keyboard shortcut for maintenance (Alt+M+O / Alt+M+C)
  useEffect(() => {
    const keysPressed: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.code] = true;
      if (e.altKey && keysPressed['KeyM'] && keysPressed['KeyO']) {
        e.preventDefault();
        setShowSecretModal(true);
      }
      if (e.altKey && keysPressed['KeyM'] && keysPressed['KeyC']) {
        e.preventDefault();
        setShowSecretModal(false);
        setPasscode('');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // QR Scanner effect
  useEffect(() => {
    if (selectedRole === null || authMethod !== 'qr' || !scanning) return;

    qrReaderRef.current = new Html5Qrcode("qr-reader");

    const startScanner = async () => {
      try {
        await qrReaderRef.current?.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
          async (decodedText) => {
            await qrReaderRef.current?.stop();
            setScanning(false);
            await handleQRLogin(decodedText.trim());
          },
          () => {}
        );
      } catch (err: any) {
        setQrError("Gagal memulai kamera. Izinkan akses kamera.");
      }
    };

    startScanner();

    return () => {
      qrReaderRef.current?.stop().catch(() => {});
    };
  }, [selectedRole, authMethod, scanning]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = selectedRole === 'siswa' ? '/siswa/login' : '/guruTendik/login';
      const res = await axios.post(`${BASE_URL}${endpoint}`, { email, password });

      if (res.data.success) {
        localStorage.setItem('user_profile', JSON.stringify(res.data.data));
        localStorage.setItem('login_role', selectedRole);
        localStorage.setItem('token', res.data.token);
        navigate('/scanner', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRLogin = async (qrCodeData: string) => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);
    setQrError(null);

    try {
      const res = await axios.post(`${BASE_URL}/scan-qr/login-qr`, { 
        qrCodeData,
        role: selectedRole 
      });

      if (res.data.success) {
        localStorage.setItem('user_profile', JSON.stringify(res.data.data));
        localStorage.setItem('login_role', res.data.role || selectedRole);
        localStorage.setItem('token', res.data.token);
        navigate('/scanner', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'QR tidak valid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenance = async (type: 'activate' | 'deactivate') => {
    if (passcode !== 'HIDDENSCHOOL') {
      alert('Kata kunci salah!');
      return;
    }

    setIsMaintenanceLoading(true);
    try {
      const endpoint = type === 'deactivate' ? '/auth/maintenance/deactivate' : '/auth/maintenance/activate';
      await axios.post(`${BASE_URL}${endpoint}`, { passcode });
      alert('Status maintenance berhasil diperbarui');
      setShowSecretModal(false);
      setPasscode('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses');
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setQrError(null);
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans text-slate-200 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-[420px] relative z-10 space-y-8">
        {/* Header */}

        {
          selectedRole === null && (
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-wider text-white">
                SCANNER<span className="text-blue-500">-</span>PRO
              </h1>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-2">Smart Attendance System</p>
            </div>
          )
        }

        {/* Role Selection Cards */}
        {selectedRole === null ? (
          <div className="space-y-5">
            <div className="text-center text-sm text-slate-400 mb-4">
              Pilih jenis akun Anda
            </div>

            <div
              onClick={() => {
                setSelectedRole('siswa');
                setAuthMethod('qr'); // default QR untuk siswa
                resetForm();
              }}
              className="text-center bg-slate-900/50 border border-slate-700 hover:border-blue-600/50 rounded-2xl p-6 cursor-pointer transition-all active:scale-[0.98] shadow-lg"
            >
              <h2 className="text-xl font-bold text-white">Siswa</h2>
              {/* <p className="text-sm text-slate-400 mt-2">Gunakan kartu pelajar atau email sekolah</p> */}
            </div>

            <div
              onClick={() => {
                setSelectedRole('guru');
                setAuthMethod('email'); // default email untuk guru
                resetForm();
              }}
              className="text-center bg-slate-900/50 border border-slate-700 hover:border-blue-600/50 rounded-2xl p-6 cursor-pointer transition-all active:scale-[0.98] shadow-lg"
            >
              <h2 className="text-xl font-bold text-white">Guru / Tendik</h2>
              {/* <p className="text-sm text-slate-400 mt-2">Gunakan NIP/email atau kartu identitas</p> */}
            </div>
          </div>
        ) : (
          <>
            {/* Auth Method Switcher */}
            <div className="flex bg-slate-950/60 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => {
                  setAuthMethod('email');
                  setScanning(false);
                  resetForm();
                }}
                className={`flex-1 py-3 rounded-lg text-sm flex items-center justify-center gap-3 cursor-pointer active:scale-[0.96] hover:brightness-90 font-medium transition-all ${
                  authMethod === 'email'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail size={15} /> 
                <p className='relative -top-[0.5px]'>
                  Email / Password
                </p>
              </button>
              <button
                onClick={() => {
                  setAuthMethod('qr');
                  resetForm();
                }}
                className={`flex-1 py-3 rounded-lg text-sm flex items-center justify-center gap-3 cursor-pointer active:scale-[0.96] hover:brightness-90 font-medium transition-all ${
                  authMethod === 'qr'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode size={15} /> 
                <p className='relative -top-[0.5px]'>
                  Scan QR Kartu
                </p>
              </button>
            </div>

            {/* Content berdasarkan auth method */}
            {authMethod === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm py-3 px-4 rounded-xl text-center">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@sekolah.id"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className='w-full flex flex-col item-center gap-3 justify-between'>
                  <button
                     onClick={() => {
                      setSelectedRole(null);
                      resetForm();
                    }}
                    className="w-full flex items-center justify-center gap-3 cursor-pointer active:scale-[0.96] py-4 border border-slate-500/40 bg-transparent rounded-2xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-60"
                  >
                    <ArrowLeft size={16} />
                    <p className='text-xs'>Kembali</p>
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-xs cursor-pointer active:scale-[0.97] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-blue-900/30 transition-all disabled:opacity-60"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Masuk sekarang'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {(error || qrError) && (
                  <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm py-3 px-4 rounded-xl text-center">
                    {error || qrError}
                  </div>
                )}

                <div id="qr-reader" className="w-full h-80 bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-inner" />

                {!scanning ? (
                  <div className='w-full flex flex-col item-center gap-3 justify-between'>
                    <button
                      onClick={() => {
                        setSelectedRole(null);
                        resetForm();
                      }}
                      className="w-full flex items-center justify-center gap-3 cursor-pointer active:scale-[0.96] py-4 border border-slate-500/40 bg-transparent rounded-2xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-60"
                    >
                      <ArrowLeft size={16} />
                      <p className='text-xs'>Kembali</p>
                    </button>
                    <button
                      onClick={() => setScanning(true)}
                      disabled={isLoading}
                      className="w-full text-xs cursor-pointer active:scale-[0.97] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-green-900/30 transition-all disabled:opacity-60"
                    >
                      Mulai Scan Kartu
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setScanning(false);
                      qrReaderRef.current?.stop().catch(() => {});
                    }}
                    className="w-full text-xs cursor-pointer active:scale-[0.97] py-4 bg-red-700/80 hover:bg-red-600 rounded-2xl font-bold uppercase tracking-wider shadow-lg shadow-red-900/30 transition-all"
                  >
                    Berhenti Scan
                  </button>
                )}

                <p className="text-xs text-slate-500 text-center">
                  Pastikan kartu menghadap kamera dengan baik dan pencahayaan cukup
                </p>

                {isLoading && (
                  <div className="text-center text-blue-400 animate-pulse text-sm">
                    Memverifikasi...
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Maintenance Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-white font-black text-xl mb-2">ADMIN OVERRIDE</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Maintenance Console</p>

            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-white tracking-widest outline-none focus:border-red-500 mb-6"
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleMaintenance('deactivate')}
                disabled={isMaintenanceLoading}
                className="py-3 bg-red-900/40 hover:bg-red-800/60 text-red-300 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {isMaintenanceLoading ? '...' : 'Shutdown'}
              </button>
              <button
                onClick={() => handleMaintenance('activate')}
                disabled={isMaintenanceLoading}
                className="py-3 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {isMaintenanceLoading ? '...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}