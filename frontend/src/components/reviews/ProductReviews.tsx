import { useState, useEffect, useCallback } from "react";
import { Star, User, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { reviewService, type Review, type ReviewStats } from "../../services/reviewService";
import { cn } from "../../utils/cn";

interface ProductReviewsProps {
  productId: string;
}

const MICRO = "text-[11px] font-bold uppercase tracking-[0.12em]";

const ReviewCard = ({ review }: { review: Review }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongComment = review.comment && review.comment.length > 200;

  return (
    <div className="rounded-card border-2 border-inverse bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* A genuine avatar is the one thing allowed to stay round. */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-inverse bg-inverse">
            {review.User?.avatar ? (
              <img
                src={review.User.avatar}
                alt={review.User.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-inverse" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="font-display text-xl font-semibold uppercase leading-none text-primary">
              {review.User?.username || "Anonymous"}
            </p>
            {review.isVerifiedPurchase && (
              <span className={`mt-1 flex items-center gap-1 ${MICRO} text-pitch`}>
                <ThumbsUp className="h-3 w-3" aria-hidden="true" /> Verified Purchase
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0" aria-label={`Rated ${review.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              aria-hidden="true"
              className={cn(
                "h-4 w-4",
                i <= review.rating ? "fill-sale text-sale" : "text-border-primary"
              )}
            />
          ))}
        </div>
      </div>

      {review.title && (
        <p className="mb-2 font-display text-xl font-semibold uppercase leading-none text-primary">
          {review.title}
        </p>
      )}

      <p className="text-sm leading-relaxed text-tertiary">
        {expanded || !isLongComment ? review.comment : `${review.comment?.substring(0, 200)}...`}
      </p>

      {isLongComment && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-2 flex min-h-[44px] items-center gap-1 ${MICRO} text-accent transition-colors duration-snap ease-snap hover:text-accent-hover`}
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="h-3 w-3" aria-hidden="true" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </>
          )}
        </button>
      )}

      <p className={`mt-4 tabular-nums ${MICRO} text-tertiary`}>
        {new Date(review.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
};

const RatingBar = ({ rating, count, total }: { rating: number; count: number; total: number }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 font-display text-lg font-semibold leading-none tabular-nums text-primary">
        {rating} ★
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-tag border border-border-primary bg-card">
        <div
          className="h-full bg-sale-bright transition-all duration-snap ease-snap"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm tabular-nums text-tertiary">{count}</span>
    </div>
  );
};

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReviews = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await reviewService.getProductReviews(productId, pageNum);
      if (pageNum === 1) {
        setReviews(response.data);
      } else {
        setReviews((prev) => [...prev, ...response.data]);
      }
      setStats(response.stats);
      setHasMore(pageNum < response.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(page + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20" aria-busy="true">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-primary border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Rating Summary */}
      {stats && (
        <div className="rounded-card border-2 border-inverse bg-card p-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-display text-[56px] font-semibold leading-none tabular-nums text-primary">
                {stats.averageRating.toFixed(1)}
              </span>
              <div
                className="my-3 flex"
                aria-label={`Average rating ${stats.averageRating.toFixed(1)} out of 5`}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    aria-hidden="true"
                    className={cn(
                      "h-5 w-5",
                      i <= Math.round(stats.averageRating)
                        ? "fill-sale text-sale"
                        : "text-border-primary"
                    )}
                  />
                ))}
              </div>
              <p className={`tabular-nums ${MICRO} text-tertiary`}>
                {stats.totalReviews} {stats.totalReviews === 1 ? "Review" : "Reviews"}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <RatingBar
                  key={rating}
                  rating={rating}
                  count={stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  total={stats.totalReviews}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-card border-2 border-border-primary bg-card py-12 text-center">
            <p className={`${MICRO} text-tertiary`}>
              No reviews yet. Be the first to review this product.
            </p>
          </div>
        ) : (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </div>

      {/* Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-tag border-2 border-inverse bg-transparent px-8 font-display text-lg uppercase leading-none tracking-[0.04em] text-primary transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-border-primary disabled:bg-secondary disabled:text-muted disabled:shadow-none"
          >
            {loading ? "Loading..." : "Load More Reviews"}
          </button>
        </div>
      )}
    </div>
  );
}