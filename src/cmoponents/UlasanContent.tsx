// src/components/UlasanContent.tsx
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

interface UlasanContentProps {
  comments: any[];
  avgRating: number | null;
  loading: boolean;
  error: any;
  schoolId: number | null;
  token: string | null;
  onCommentAdded: (newComment: any) => void;
}

export default function UlasanContent({
  comments,
  avgRating,
  loading,
  error,
  schoolId,
  token,
  onCommentAdded,
}: UlasanContentProps) {
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const BASE_URL_SCHOOL = 'https://be-school.kiraproject.id'

  const handleSubmit = async () => {
    if (!newComment.trim() || !schoolId) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${BASE_URL_SCHOOL}/rating`, // pastikan BASE_URL_SCHOOL sudah diimport atau di-pass sebagai prop
        {
          schoolId,
          name: 'Anonim', // atau ambil dari userProfile jika ada
          email: 'anonymous@email.com',
          comment: newComment.trim(),
          rating,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        onCommentAdded(res.data.data);
        setNewComment('');
        setRating(5);
        toast.success('Ulasan berhasil dikirim!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Memuat ulasan...</div>;
  if (error) return <div className="text-red-400 text-center py-10">{'dd'}</div>;

  return (
    <div className="space-y-5">
      {/* Statistik rating */}
      <div className="text-center">
        <div className="text-4xl font-black text-amber-400">
          {avgRating ? avgRating.toFixed(1) : '—'}
        </div>
        <div className="text-xs text-slate-400">
          Rata-rata dari {comments?.length || 0} ulasan
        </div>
      </div>
      
      {/* Form input ulasan */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Tulis pengalaman atau saran Anda..."
          className="w-full bg-transparent border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-blue-500/50 min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`text-2xl ${n <= rating ? 'text-amber-400' : 'text-slate-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Mengirim...' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
}