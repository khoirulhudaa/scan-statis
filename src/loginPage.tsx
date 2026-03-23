import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "https://be-school.kiraproject.id";

export default function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru' | null>(null);

  // Email login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maintenance modal states
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [passcode, setPasscode] = useState('');

  // Keyboard shortcut for maintenance
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
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  const handleMaintenance = async (type: 'activate' | 'deactivate') => {
    if (passcode !== 'HIDDENSCHOOL') {
      alert('Kata kunci salah!');
      return;
    }
    try {
      const endpoint = type === 'deactivate' ? '/auth/maintenance/deactivate' : '/auth/maintenance/activate';
      await axios.post(`${BASE_URL}${endpoint}`, { passcode });
      alert('Status maintenance berhasil diperbarui');
      setShowSecretModal(false);
      setPasscode('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses');
    } 
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans text-slate-200 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-[420px] relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-wider text-white">
            SCANNER<span className="text-blue-500">-</span>PRO
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-2">Smart Attendance System</p>
        </div>

        {selectedRole === null ? (
          /* Role Selection */
          <div className="space-y-5">
            <div className="text-center text-sm text-slate-400 mb-4">Pilih jenis akun Anda</div>
            <div
              onClick={() => { setSelectedRole('siswa'); resetForm(); }}
              className="text-center bg-slate-900/50 border border-slate-700 hover:border-blue-600/50 rounded-2xl p-6 cursor-pointer transition-all active:scale-[0.98] shadow-lg"
            >
              <h2 className="text-xl font-bold text-white">Siswa</h2>
            </div>
            <div
              onClick={() => { setSelectedRole('guru'); resetForm(); }}
              className="text-center bg-slate-900/50 border border-slate-700 hover:border-blue-600/50 rounded-2xl p-6 cursor-pointer transition-all active:scale-[0.98] shadow-lg"
            >
              <h2 className="text-xl font-bold text-white">Guru / Tendik</h2>
            </div>
          </div>
        ) : (
          /* Email Login Form */
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="text-center">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Login Sebagai {selectedRole}</p>
            </div>

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
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 transition-all"
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
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <div className='w-full flex flex-col gap-3'>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-xs cursor-pointer active:scale-[0.97] py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-60"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk sekarang'}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole(null); resetForm(); }}
                className="w-full flex items-center justify-center gap-2 cursor-pointer py-4 border border-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-400 hover:bg-slate-800/30 transition-all"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Maintenance Modal (Hidden) */}
      {showSecretModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm text-center">
            <h2 className="text-white font-black text-xl mb-2">ADMIN OVERRIDE</h2>
            <input
              type="password"
              autoFocus
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="PASSCODE"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-white outline-none focus:border-red-500 mb-6"
            />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleMaintenance('deactivate')} className="py-3 bg-red-900/40 text-red-300 rounded-xl font-medium">Shutdown</button>
              <button onClick={() => handleMaintenance('activate')} className="py-3 bg-blue-900/40 text-blue-300 rounded-xl font-medium">Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}