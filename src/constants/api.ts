// Base URL utama (bisa diubah ke env variable nanti)
export const BASE_URL_SCHOOL = 'https://be-school.kiraproject.id';
export const BASE_URL_PERPUS = 'https://be-perpus.kiraproject.id';

// Jika nanti pakai environment variables (recommended untuk production)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

// Optional: kumpulkan semua endpoint di sini agar mudah diubah
export const ENDPOINTS = {
  // School API
  SCAN_QR: '/scan-qr',
  PROFILE_BIODATA: '/profile/me/biodata',
  PROFILE_PHOTO: '/profile/me/photo',
  ATTENDANCES: '/siswa/get-attendances',
  PENGUMUMAN: '/pengumuman',
  BERITA: '/berita',
  TUGAS: '/tugas',
  OSIS: '/osis',
  ALUMNI: '/alumni',
  RATING: '/rating',

  // Perpus API
  PERPUS_KEHADIRAN: '/peminjam/kehadiran',

  // Auth
  EXTERNAL_QR_LOGIN: '/auth/external-qr-login',
} as const;