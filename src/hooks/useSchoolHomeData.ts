// src/hooks/useSchoolHomeData.ts
import { useCallback } from 'react';
import { schoolDataService } from './schoolDataService';

// Tipe data untuk semua setter yang dibutuhkan
interface HomeDataSetters {
  setAnnouncements: (data: any[]) => void;
  setNews: (data: any[]) => void;
  setTugas: (data: any[]) => void;
  setOsisData: (data: any) => void;
  setAlumniData: (data: any[]) => void;
  setComments: (data: any[]) => void;
  setAvgRating: (rating: number | null) => void;
  setLoadingData: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrorData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const useSchoolHomeData = () => {
  const loadHomeData = useCallback(
    async (
      schoolId: number | null,
      token: string | null,
      setters: HomeDataSetters
    ) => {
      // Guard clause: jangan fetch jika tidak ada schoolId atau token
      if (!schoolId || !token) {
        console.warn('loadHomeData: schoolId atau token tidak tersedia');
        return;
      }

      // Mulai loading untuk semua kategori
      setters.setLoadingData((prev) => ({
        ...prev,
        announcements: true,
        news: true,
        tugas: true,
        osis: true,
        kelulusan: true,
        ulasan: true,
      }));

      const options = { schoolId, token };

      try {
        // Jalankan semua fetch secara paralel dengan Promise.all
        const [
          announcementsData,
          newsData,
          tugasData,
          osisData,
          alumniData,
          commentsResult,
        ] = await Promise.all([
          schoolDataService.fetchAnnouncements(options).catch((err) => {
            console.error('Fetch pengumuman gagal:', err);
            return [];
          }),
          schoolDataService.fetchNews(options).catch((err) => {
            console.error('Fetch berita gagal:', err);
            return [];
          }),
          schoolDataService.fetchTugas(options).catch((err) => {
            console.error('Fetch tugas gagal:', err);
            return [];
          }),
          schoolDataService.fetchOsis(options).catch((err) => {
            console.error('Fetch OSIS gagal:', err);
            return null;
          }),
          schoolDataService.fetchAlumni(options).catch((err) => {
            console.error('Fetch alumni gagal:', err);
            return [];
          }),
          schoolDataService.fetchComments(options).catch((err) => {
            console.error('Fetch ulasan gagal:', err);
            return { comments: [], avgRating: null };
          }),
        ]);

        // Update state dengan data yang berhasil
        setters.setAnnouncements(announcementsData);
        setters.setNews(newsData);
        setters.setTugas(tugasData);
        setters.setOsisData(osisData);
        setters.setAlumniData(alumniData);
        setters.setComments(commentsResult.comments);
        setters.setAvgRating(commentsResult.avgRating);

        // Optional: clear error jika berhasil
        setters.setErrorData((prev) => ({
          ...prev,
          announcements: '',
          news: '',
          tugas: '',
          osis: '',
          kelulusan: '',
          ulasan: '',
        }));
      } catch (err) {
        console.error('Gagal memuat data home secara keseluruhan:', err);

        // Set error umum untuk semua bagian
        setters.setErrorData((prev) => ({
          ...prev,
          announcements: 'Gagal memuat pengumuman',
          news: 'Gagal memuat berita',
          tugas: 'Gagal memuat tugas',
          osis: 'Gagal memuat data OSIS',
          kelulusan: 'Gagal memuat data alumni',
          ulasan: 'Gagal memuat ulasan',
        }));
      } finally {
        // Matikan semua loading indicator
        setters.setLoadingData({
          announcements: false,
          news: false,
          tugas: false,
          osis: false,
          kelulusan: false,
          ulasan: false,
        });
      }
    },
    [] // dependency kosong → fungsi stabil sepanjang hidup komponen
  );

  return {
    loadHomeData,
  };
};