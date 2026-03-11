import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "https://be-school.kiraproject.id";
// const BASE_URL = "http://localhost:5005";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); 
  const [identifier, setIdentifier] = useState(''); 
  const [loginMode, setLoginMode] = useState<'siswa' | 'guru'>('siswa');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (loginMode === 'siswa') {
        response = await axios.post(`${BASE_URL}/siswa/login`, { nis: identifier });
      } else {
        response = await axios.post(`${BASE_URL}/guruTendik/login`, { email, nip: identifier });
      }
      if (response.data.success) {
        localStorage.setItem('user_profile', JSON.stringify(response.data.data));
        localStorage.setItem('login_role', loginMode);
        localStorage.setItem('token', response.data.token);
        navigate('/scanner', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Identitas tidak valid.');
    } finally {
      setIsLoading(false);
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

        <div className="bg-slate-900/40 backdrop-blur-xl shadow-2xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
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
              {loginMode === 'guru' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/70 ml-1">Akun Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="xxxxxx@gmail.com"
                    className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white/[0.07] focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 text-white"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/70 ml-1">
                  {loginMode === 'siswa' ? 'Nomor Induk Siswa' : 'Nomor Induk Pegawai'}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={loginMode === 'siswa' ? "Masukan 10 digit angka" : "Masukan 18 digit angka"}
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
    </div>
  );
}