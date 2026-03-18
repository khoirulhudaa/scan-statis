import axios from 'axios';
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "https://be-school.kiraproject.id";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'siswa' | 'guru'>('siswa');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- State Fitur Hidden Maintenance ---
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  // --- Keyboard Shortcut Logic (Alt+M+O & Alt+M+C) ---
  useEffect(() => {
    const keysPressed: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.code] = true;

      // ALT + M + O (Open)
      if (e.altKey && keysPressed['KeyM'] && keysPressed['KeyO']) {
        e.preventDefault();
        setShowSecretModal(true);
      }

      // ALT + M + C (Close)
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (loginMode === 'siswa') {
        response = await axios.post(`${BASE_URL}/siswa/login`, { email, password });
      } else {
        response = await axios.post(`${BASE_URL}/guruTendik/login`, { email, password });
      }

      if (response.data.success) {
        localStorage.setItem('user_profile', JSON.stringify(response.data.data));
        localStorage.setItem('login_role', loginMode);
        localStorage.setItem('token', response.data.token);
        navigate('/scanner', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau Password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Maintenance Action Logic ---
  const handleMaintenance = async (type: 'activate' | 'deactivate') => {
    if (passcode !== 'HIDDENSCHOOL') {
      alert('Kata kunci salah!');
      return;
    }

    setIsMaintenanceLoading(true);
    try {
      const endpoint = type === 'deactivate' 
        ? '/auth/maintenance/deactivate' 
        : '/auth/maintenance/activate';

      await axios.post(`${BASE_URL}${endpoint}`, { passcode });
      
      alert(`Aksi Berhasil: Status database telah diperbarui.`);
      setShowSecretModal(false);
      setPasscode('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses permintaan');
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans text-slate-200 relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Subtle Clean Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
      </div>
      
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-[0.2em] text-white">
            SCANNER-<span className="font-black text-blue-500">PRO</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mt-2 font-medium">Smart Attendance</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[2rem] border border-white/10 p-8">
          <div className="flex bg-slate-950/50 p-1 rounded-xl mb-8 border border-white/10">
            {(['siswa', 'guru'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setLoginMode(mode); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${loginMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {mode === 'siswa' ? 'Siswa' : 'Tendik'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold text-center uppercase tracking-wider py-3 rounded-lg animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/70 ml-1">Akun Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="xxxxxx@sekolah.id"
                  className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/70 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Verifikasi...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>

      {/* --- HIDDEN MAINTENANCE MODAL --- */}
      {showSecretModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-[320px] shadow-2xl text-center">
            <h2 className="text-white font-black text-lg tracking-tighter mb-2 italic">ADMIN OVERRIDE</h2>
            <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em] mb-6 font-bold">Maintenance Console</p>
            
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-center text-sm outline-none focus:border-red-500 transition-all mb-6 text-white tracking-[0.5em]"
            />

            <div className="space-y-3">
              <button
                onClick={() => handleMaintenance('deactivate')}
                disabled={isMaintenanceLoading}
                className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {isMaintenanceLoading ? 'Executing...' : 'Shutdown Data'}
              </button>
              <button
                onClick={() => handleMaintenance('activate')}
                disabled={isMaintenanceLoading}
                className="w-full py-3 bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Restore System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}