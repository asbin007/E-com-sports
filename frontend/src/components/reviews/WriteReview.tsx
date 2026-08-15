import { useState } from "react";
import { Star, Send } from "lucide-react";
import { reviewService } from "../../services/reviewService";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";

interface WriteReviewProps {
  productId: string;
  onReviewAdded?: () => void;
}

export default function WriteReview({ productId, onReviewAdded }: WriteReviewProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a review comment");
      return;
    }

    setLoading(true);
    try {
      await reviewService.createReview({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      setSuccess(true);
      setRating(0);
      setTitle("");
      setComment("");
      onReviewAdded?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-[2rem] p-8 text-center">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          Please log in to write a review
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-8">
      <h3 className="text-lg font-black text-stone-950 uppercase tracking-tight italic mb-6">
        Write Your Review
      </h3>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-bold">
          Review submitted successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            Your Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-2 rounded-lg transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-orange-500 text-orange-500"
                      : "text-gray-200"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {rating > 0 && ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Summarize your experience"
            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 outline-none transition-all text-sm font-medium"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            Your Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="Share your thoughts about this product..."
            className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 outline-none transition-all text-sm font-medium resize-none"
          />
          <p className="mt-2 text-xs text-gray-400 text-right">{comment.length}/1000</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}