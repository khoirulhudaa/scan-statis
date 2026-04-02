interface WelcomeBannerProps {
  userProfile: any;
  quickStats: Array<{ label: string; value: string | number; sub: string }>;
}

export default function WelcomeBanner({ userProfile, quickStats }: WelcomeBannerProps) {
  
  // Fungsi hitung semester otomatis
  const calculateSemester = (batchYear: string | number) => {
    const year = parseInt(batchYear.toString());
    if (isNaN(year)) return "-";

    const now = new Date();
    const currentYear = now.getFullYear(); // 2026
    const currentMonth = now.getMonth() + 1; // 1-12

    // Selisih tahun (misal 2026 - 2024 = 2)
    const diffYear = currentYear - year;
    
    // Jika bulan 1-6 (Jan-Jun), masuk semester Genap
    // Jika bulan 7-12 (Jul-Des), masuk semester Ganjil
    const isSecondHalf = currentMonth >= 7;
    
    // Rumus: (Tahun * 2) + (1 jika ganjil, 2 jika genap)
    const semester = (diffYear * 2) + (isSecondHalf ? 1 : 0);
    
    // Tambah 1 karena angkatan baru di tahun pertama mulai dari semester 1 (bukan 0)
    return semester + (isSecondHalf ? 0 : 0); 
    // Logika sederhananya untuk Maret 2026:
    // Angkatan 2024: (2026-2024)*2 = 4. Maret adalah < Juli, jadi tetap semester 4.
  };

  const currentSemester = userProfile.batch ? calculateSemester(userProfile.batch) : "1";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-5 shadow-xl shadow-blue-900/30">
      {/* grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-200 mb-1">
            Selamat Datang 👋
          </p>
          <h2 className="text-lg w-full truncate font-black leading-tight text-white">
            {userProfile.name || userProfile.nama || 'User'}
          </h2>
          <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wider font-medium">
            {userProfile.role === 'siswa' ? 'NISN' : 'NIP'}: {userProfile.nisn || userProfile.nip || '00000000'}
          </p>
        </div>

        {
          (userProfile.role?.toLowerCase() === 'siswa') && (
            <div className="text-right text-white">
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Semester</p>
              <p className="text-2xl font-black leading-none">{currentSemester}</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider mt-1">Angkatan {userProfile.batch}</p>
            </div>
          )
        }
      </div>

      {/* quick stats */}
      <div className={`relative z-10 mt-4 grid ${userProfile.role?.toLowerCase() === 'siswa' ? 'grid-cols-3' : 'grid-cols-1'} gap-2`}>
        {quickStats.map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center text-white">
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-[8px] text-blue-100 font-bold uppercase tracking-wide leading-tight">
              {s.label}
            </p>
            <p className="text-[7px] text-blue-200/70 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}