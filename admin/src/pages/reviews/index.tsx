import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Star, Check, Eye, EyeOff, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  createdAt: string;
  User?: { id: string; username: string; email: string };
  Product?: { id: string; name: string; slug: string };
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data?.data || []);
      setStats(res.data?.stats || { averageRating: 0, totalReviews: 0 });
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleVisibility = async (review: Review) => {
    try {
      await api.put(`/admin/reviews/${review.id}/visibility`, { isVisible: !review.isVisible });
      setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, isVisible: !r.isVisible } : r));
      toast.success(review.isVisible ? 'Review hidden' : 'Review visible');
    } catch (err: any) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats.totalReviews} reviews · Average {stats.averageRating} stars
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-5 h-5 ${s <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
        <span className="text-2xl font-bold text-gray-900">{stats.averageRating}</span>
        <span className="text-sm text-gray-500">out of 5</span>
      </div>

      {/* Reviews grid */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  review.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {review.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 mb-3">&ldquo;{review.comment}&rdquo;</p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{review.User?.username || 'User'}</span>
                  {review.Product?.name && <span> · {review.Product.name}</span>}
                  <span className="ml-2">{new Date(review.createdAt).toLocaleDateString('en-NP')}</span>
                </div>
                <button
                  onClick={() => toggleVisibility(review)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                  title={review.isVisible ? 'Hide' : 'Show'}
                >
                  {review.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-500" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
