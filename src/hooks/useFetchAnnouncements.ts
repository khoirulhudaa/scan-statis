// src/hooks/useFetchAnnouncements.ts
import { useCallback } from 'react';
import axios from 'axios';
import { BASE_URL_SCHOOL } from '../constants/api';

export const useFetchAnnouncements = (
  schoolId: number | null,
  token: string | null,
  setAnnouncements: (data: any[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void
) => {
  const fetchAnnouncements = useCallback(async () => {
    if (!schoolId || !token) return;

    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/pengumuman`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat pengumuman');
    } finally {
      setLoading(false);
    }
  }, [schoolId, token, setAnnouncements, setLoading, setError]);

  return fetchAnnouncements;
};