// src/services/schoolDataService.ts
import axios from 'axios';
import { BASE_URL_SCHOOL } from '../constants/api';

interface FetchOptions {
  schoolId: number | null;
  token: string | null;
}

export const schoolDataService = {
  async fetchAnnouncements({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return [];
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/pengumuman`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.success ? res.data.data || [] : [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat pengumuman');
    }
  },

  async fetchNews({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return [];
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/berita`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.success ? res.data.data || [] : [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat berita');
    }
  },

  async fetchTugas({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return [];
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/tugas`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.success ? res.data.data || [] : [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat tugas');
    }
  },

  async fetchOsis({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return null;
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/osis`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.success ? res.data.data : null;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat data OSIS');
    }
  },

  async fetchAlumni({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return [];
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/alumni`, {
        params: { schoolId, isActive: true, isVerified: true },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.success ? res.data.data || [] : [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat data alumni');
    }
  },

  async fetchComments({ schoolId, token }: FetchOptions) {
    if (!schoolId || !token) return { comments: [], avgRating: null };
    try {
      const res = await axios.get(`${BASE_URL_SCHOOL}/rating`, {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.success) return { comments: [], avgRating: null };

      const comments = res.data.data || [];
      let avgRating = null;
      if (comments.length > 0) {
        const sum = comments.reduce((acc: number, c: any) => acc + Number(c.rating), 0);
        avgRating = sum / comments.length;
      }
      return { comments, avgRating };
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memuat ulasan');
    }
  },
};