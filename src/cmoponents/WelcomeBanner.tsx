interface WelcomeBannerProps {
  userProfile: any;
  quickStats: Array<{ label: string; value: string | number; sub: string }>;
}

export default function WelcomeBanner({ userProfile, quickStats }: WelcomeBannerProps) {
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
          <h2 className="text-lg w-full truncate font-black leading-tight">
            {userProfile.name || userProfile.nama || 'Siswa'}
          </h2>
          <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-wider font-medium">
            {userProfile.kelas || userProfile.role || 'Siswa'}
          </p>
        </div>

        {
          userProfile.role === 'siswa' && (
            <div className="text-right">
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">Semester</p>
              <p className="text-2xl font-black leading-none">2</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider">2025/2026</p>
            </div>
          )
        }
      </div>

      {/* quick stats */}
      <div className={`relative z-10 mt-4 grid ${userProfile.role === 'siswa' ? 'grid-cols-3' : 'grid-cols-1'} gap-2`}>
        {quickStats.map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
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