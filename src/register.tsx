import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "https://be-school.kiraproject.id";

export default function RegisterSiswa() {
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState('');

  const [name, setName] = useState('');
  const [nis, setNis] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()

  // ambil sekolah
  useEffect(() => {
    axios.get(`${BASE_URL}/schools`)
      .then(res => setSchools(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${BASE_URL}/siswa`, {
        name,
        nis,
        schoolId,
        email,
        password
      });

      alert('Berhasil daftar! Silakan login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal daftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Daftar Siswa</h2>

      <select value={schoolId} onChange={e => setSchoolId(e.target.value)} required>
        <option value="">Pilih Sekolah</option>
        {schools.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama" required />
      <input value={nis} onChange={e => setNis(e.target.value)} placeholder="NIS" required />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />

      <button disabled={loading}>
        {loading ? 'Loading...' : 'Daftar'}
      </button>

      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
            Sudah punya akun?{' '}
            <span
            onClick={() => navigate('/')}
            className="text-blue-400 cursor-pointer hover:text-blue-300"
            >
            Masuk di sini
            </span>
        </p>
        </div>
    </form>
  );
}