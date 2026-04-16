import axios from 'axios';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "https://be-school.kiraproject.id";

export default function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'siswa' | 'guru' | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);

  // form state
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState('');

  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [batch, setBatch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

 useEffect(() => {
  const fetchSchools = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/sekolah/`);

      if (res.data.success) {
        const filteredSchools = res.data.data.filter(
          (school: any) => school.namaSekolah !== "********"
        );  

        setSchools(filteredSchools);

        // set default
        if (filteredSchools.length > 0) {
          setSchoolId(filteredSchools[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchSchools();
}, []);

useEffect(() => {
  const fetchClasses = async () => {
    if (!schoolId) return;

    try {
      const res = await axios.get(`${BASE_URL}/kelas`, {
        params: { schoolId }
      });

      if (res.data.success) {
        setClasses(res.data.data);

        if (res.data.data.length > 0) {
          setClassName(res.data.data[0].className);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchClasses();
}, [schoolId]);

  const resetForm = () => {
    setName('');
    setNis('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setSchoolId('');
    setError(null);
  };

  // LOGIN
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = selectedRole === 'siswa'
        ? '/siswa/login'
        : '/guruTendik/login';

      const res = await axios.post(`${BASE_URL}${endpoint}`, {
        email,
        password
      });

      if (res.data.success) {
        localStorage.setItem('user_profile', JSON.stringify(res.data.data));
        localStorage.setItem('login_role', selectedRole);
        localStorage.setItem('token', res.data.token);

        navigate('/scanner', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = selectedRole === 'siswa'
        ? '/siswa'
        : '/guruTendik';

    const payload =
      selectedRole === 'siswa'
        ? { 
            name, 
            nis, 
            schoolId, 
            email, 
            password,
            class: className,
            batch
          }
        : { 
            nama: name, 
            schoolId, 
            email, 
            password, 
            role: 'guru', 
            jenisKelamin: 'L' 
          };

      await axios.post(`${BASE_URL}${endpoint}`, payload);

      alert('Berhasil daftar, silakan login');
      setIsLogin(true);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal daftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-200 relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-[420px] z-10 space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-white">
            SCANNER<span className="text-blue-500">-</span>PRO
          </h1>
          {
            (isLogin|| !selectedRole) && (
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">
                Smart Attendance System
              </p>
            )
          }
        </div>

        {/* PILIH ROLE */}
        {!selectedRole ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-400">
              Pilih jenis akun
            </p>

            <div
              onClick={() => { setSelectedRole('siswa'); resetForm(); }}
              className="bg-slate-900 border border-slate-700 p-5 rounded-xl text-center cursor-pointer hover:border-blue-500"
            >
              Siswa
            </div>

            <div
              onClick={() => { setSelectedRole('guru'); resetForm(); }}
              className="bg-slate-900 border border-slate-700 p-5 rounded-xl text-center cursor-pointer hover:border-blue-500"
            >
              Guru / Tendik
            </div>
          </div>
        ) : (
          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-5"
          >

            {/* <div className="text-center">
              <p className="text-slate-300 mt-[-14px] text-sm font-normal">{isLogin ? 'Masuk' : 'Daftar'} Sebagai {selectedRole}</p>
            </div> */}

            {/* ERROR */}
            {error && (
              <div className="bg-red-900/30 text-red-300 text-sm p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* REGISTER ONLY */}
            {!isLogin && (
              <div className="space-y-4">

                {/* SEKOLAH (FULL WIDTH) */}
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl"
                >
                  <option value="-">Pilih sekolah</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaSekolah}
                    </option>
                  ))}
                </select>

                {/* ROW 1 */}
                <div className={`grid ${selectedRole === 'siswa' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama"
                    className="w-full bg-slate-800 p-3 rounded-xl"
                    required
                  />

                  {selectedRole === 'siswa' && (
                    <input
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="NIS"
                      maxLength={5}
                      className="w-full bg-slate-800 p-3 rounded-xl"
                      required
                    />
                  )
                }
                </div>

                {/* ROW 2 (KHUSUS SISWA) */}
                {selectedRole === 'siswa' && (
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-slate-800 p-3 rounded-xl"
                      required
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.className}>
                          {c.className}
                        </option>
                      ))}
                    </select>

                    <input
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="Angkatan"
                      className="w-full bg-slate-800 p-3 rounded-xl"
                      required
                    />
                  </div>
                )}

              </div>
            )}


          {/* EMAIL WITH ICON */}
          <div className="relative group">
            {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div> */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`Email ${selectedRole}`}
              className="w-full bg-slate-800 border border-transparent focus:border-blue-500 p-3 rounded-xl outline-none transition-all"
              required
            />
          </div>

          {/* PASSWORD WITH SHOW/HIDE */}
          <div className="relative group">
            {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div> */}
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-800 border border-transparent focus:border-blue-500 p-3 pr-10 rounded-xl outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

            {/* BUTTON */}
            <div className='w-full space-y-4 gap-4'>
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer active:scale-[0.98] hover:brightness-80 w-full py-3 bg-blue-600 rounded-xl font-bold"
              >
                {isLoading
                  ? 'Memproses...'
                  : isLogin
                    ? 'Masuk'
                    : 'Daftar'}
              </button>
              <button
                type="submit"
                onClick={() => setSelectedRole(null)}
                className="cursor-pointer active:scale-[0.98] hover:brightness-80 w-full py-3 rounded-xl font-bold"
              >
                Kembali
              </button>
              
            </div>

            {/* TOGGLE (TIDAK TABRAKAN) */}
            {/* <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              {isLogin ? (
                <p className="text-md text-slate-400">
                  Belum punya akun?{' '}
                  <span
                    onClick={() => { setIsLogin(false); resetForm(); }}
                    className="text-blue-400 cursor-pointer"
                  >
                    Daftar
                  </span>
                </p>
              ) : (
                <p className="text-md text-slate-400">
                  Sudah punya akun?{' '}
                  <span
                    onClick={() => { setIsLogin(true); resetForm(); }}
                    className="text-blue-400 cursor-pointer"
                  >
                    Masuk
                  </span>
                </p>
              )}
            </div> */}
          </form>
        )}
      </div>
    </div>
  );
}