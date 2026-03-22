// src/components/scanner/ProfileView.tsx
import { CheckCircle, Download, Eye, EyeOff } from 'lucide-react';

interface ProfileViewProps {
  userProfile: any;
  preview: string | null;
  form: any;
  setForm: (form: any) => void;
  showOldPassword: boolean;
  setShowOldPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpdateProfile: () => void;
  loadingProfile: boolean;
  photoLoading: boolean;
}

export default function ProfileView({
  userProfile,
  preview,
  form,
  setForm,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  handlePhotoChange,
  handleUpdateProfile,
  loadingProfile,
  photoLoading,
}: ProfileViewProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start z-10 overflow-y-auto pb-32">
      <div className="w-full p-4 md:p-6">
        <div className="flex items-center justify-center w-full text-center flex-col space-y-2 gap-4 mb-4 border-b border-white/5 pb-6">
          <div className="relative group">
            <img
              src={preview || userProfile.photoUrl || 'https://via.placeholder.com/150'}
              className="w-14 h-14 rounded-full object-cover border border-white/10"
              alt="Profile"
            />
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-500 transition-colors">
              <Download size={12} className="text-white rotate-180" />
              <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
            </label>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">
              Profil Pengguna
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
              {userProfile.role || 'Member'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Nama */}
          <div className="group">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Nama
            </p>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
              placeholder="Nama Lengkap"
            />
          </div>

          {/* Email */}
          <div className="group">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Email
            </p>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 focus:border-blue-500/50 outline-none text-xs transition-all"
              placeholder="Email Sekolah"
            />
          </div>

          {/* Password Lama */}
          <div className="relative group w-full">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Password Lama
            </p>
            <input
              type={showOldPassword ? 'text' : 'password'}
              value={form.oldPassword || ''}
              onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
              className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 text-xs outline-none"
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

          {/* Password Baru */}
          <div className="relative group w-full">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Password Baru
            </p>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={form.newPassword || ''}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 text-xs outline-none"
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

          {/* NIS / NISN / NIP */}
          <div className="grid grid-cols-2 gap-3">
            {userProfile.role === 'siswa' ? (
              <>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                    NIS
                  </p>
                  <input
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 text-xs outline-none"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                    NISN
                  </p>
                  <input
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl bg-slate-800/60 border border-white/5 text-xs outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                  NIP
                </p>
                <input
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl bg-black/20 border border-white/5 text-xs outline-none"
                />
              </div>
            )}
          </div>

          {/* Tombol Update */}
          <button
            onClick={handleUpdateProfile}
            disabled={loadingProfile || photoLoading}
            className="mt-2 w-full py-4 cursor-pointer active:scale-95 hover:bg-blue-800 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
  );
}