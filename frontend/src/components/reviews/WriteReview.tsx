import { useState } from "react";
import { Star, Send } from "lucide-react";
import { reviewService } from "../../services/reviewService";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiError";

interface WriteReviewProps {
  productId: string;
  onReviewAdded?: () => void;
}

const LABEL = "mb-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary";
const FIELD =
  "w-full min-h-[44px] rounded-tag border-2 border-border-primary bg-card px-4 py-3 text-sm text-primary transition-all duration-snap ease-snap placeholder:text-muted focus:border-accent";

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
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit review"));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-card border-2 border-border-primary bg-card p-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
          Please log in to write a review
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border-2 border-inverse bg-card p-8">
      <p className="eyebrow mb-3">Your verdict</p>
      <h3 className="mb-6 font-display text-[29px] font-semibold uppercase leading-none text-primary">
        Write Your Review
      </h3>

      {success && (
        <div
          role="status"
          className="mb-6 rounded-tag border-2 border-pitch bg-card p-4 text-sm font-bold text-pitch"
        >
          Review submitted successfully.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-tag border-2 border-accent bg-card p-4 text-sm font-bold text-accent"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <span className={LABEL}>Your Rating</span>
          <div className="flex gap-2" role="group" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                aria-pressed={rating === star}
                className="flex h-11 w-11 items-center justify-center rounded-tag transition-colors duration-snap ease-snap hover:bg-surface-hover"
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    "h-8 w-8 transition-colors duration-snap ease-snap",
                    star <= (hoverRating || rating)
                      ? "fill-marigold text-marigold"
                      : "text-border-primary"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 min-h-[20px] text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
            {rating > 0 && ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="review-title" className={LABEL}>
            Review Title (Optional)
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Summarize your experience"
            className={FIELD}
          />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className={LABEL}>
            Your Review
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="How did the kit fit, and how was the delivery?"
            className={`${FIELD} resize-none`}
          />
          <p className="mt-2 text-right text-[11px] font-bold uppercase tracking-[0.12em] tabular-nums text-tertiary">
            {comment.length}/1000
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border-primary border-t-inverse" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}