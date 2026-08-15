import { useState, useEffect } from "react";
import { Star, User, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { reviewService, type Review, type ReviewStats } from "../../services/reviewService";
import { cn } from "../../utils/cn";

interface ProductReviewsProps {
  productId: string;
}

const ReviewCard = ({ review }: { review: Review }) => {
  const [expanded, setExpanded] = useState(false);
  const isLongComment = review.comment && review.comment.length > 200;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center">
            {review.User?.avatar ? (
              <img src={review.User.avatar} alt={review.User.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-bold text-stone-950 text-sm">
              {review.User?.username || "Anonymous"}
            </p>
            {review.isVerifiedPurchase && (
              <span className="text-[10px] font-black uppercase tracking-wider text-green-600 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>
        </div>
        <div className="flex text-orange-500">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={cn("w-4 h-4", i <= review.rating ? "fill-current" : "text-gray-200")} />
          ))}
        </div>
      </div>

      {review.title && (
        <p className="font-black text-stone-950 mb-2 italic uppercase text-sm tracking-tight">
          {review.title}
        </p>
      )}

      <p className="text-gray-600 text-sm leading-relaxed">
        {expanded || !isLongComment ? review.comment : `${review.comment?.substring(0, 200)}...`}
      </p>

      {isLongComment && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-bold text-orange-600 uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}

      <p className="mt-4 text-xs text-gray-400">
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
      <span className="text-xs font-black text-stone-950 w-8">{rating} ★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8">{count}</span>
    </div>
  );
};

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async (pageNum = 1) => {
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
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchReviews(page + 1);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Rating Summary */}
      {stats && (
        <div className="bg-gray-50 rounded-[2rem] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-6xl font-black text-stone-950 italic">
                {stats.averageRating.toFixed(1)}
              </span>
              <div className="flex text-orange-500 my-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("w-5 h-5", i <= Math.round(stats.averageRating) ? "fill-current" : "text-gray-300")} />
                ))}
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {stats.totalReviews} Elite Reviews
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
          <div className="text-center py-12">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
              No reviews yet. Be the first to review this product!
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
            className="px-8 py-3 bg-stone-950 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More Reviews"}
          </button>
        </div>
      )}
    </div>
  );
}