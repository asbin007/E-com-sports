import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      "bg-secondary rounded-xl animate-shimmer",
      "bg-[length:200%_100%] bg-gradient-to-r from-secondary via-tertiary/50 to-secondary",
      className
    )}
  />
);

export const ProductCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-[4/5] rounded-2xl" />
    <div className="space-y-2 px-1">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-5 w-24 mt-2" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-primary">
    <div className="max-w-[1280px] mx-auto pt-4 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 py-4 mb-4">
        <Skeleton className="h-4 w-12" />
        <span className="text-muted">/</span>
        <Skeleton className="h-4 w-10" />
        <span className="text-muted">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-40" />
          <div className="border-t border-border-primary my-6" />
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-11 h-10 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-4 w-16 mb-3 mt-5" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-9 rounded-lg" />
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-2" />
          <div className="grid grid-cols-3 gap-3 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <section className="relative bg-primary border-b border-border-primary">
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 md:pb-14">
      <div className="grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-16 w-full max-w-lg" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="h-5 w-3/4 max-w-md" />
          <div className="flex gap-3 mt-7">
            <Skeleton className="h-12 w-44 rounded-xl" />
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-md mt-9">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="aspect-[5/4] rounded-3xl" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const CartItemSkeleton = () => (
  <div className="bg-card rounded-2xl p-4 sm:p-6 border border-border-primary flex flex-col sm:flex-row gap-4 sm:gap-6">
    <Skeleton className="w-full sm:w-32 h-36 sm:h-32 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  </div>
);

export const CartSkeleton = () => (
  <div className="min-h-screen bg-primary pt-4 pb-20">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-8 gap-4 border-b border-border-primary">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="bg-card rounded-2xl p-6 border border-border-primary sticky top-28 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="border-t border-border-primary pt-4">
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-3 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SpecialOffersSkeleton = () => (
  <section className="py-20 bg-inverse">
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 bg-white/10" />
          <Skeleton className="h-4 w-80 bg-white/5" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-12 h-12 rounded-xl bg-white/10" />
          <Skeleton className="w-12 h-12 rounded-xl bg-white/10" />
        </div>
      </div>
      <Skeleton className="h-[450px] rounded-3xl bg-white/5" />
      <div className="flex justify-center gap-2 mt-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8 rounded-full bg-white/10" />
        ))}
      </div>
    </div>
  </section>
);

export const OrderItemSkeleton = () => (
  <div className="flex items-center justify-between p-4 sm:p-5 bg-card rounded-xl border border-border-primary">
    <div className="flex items-center gap-4">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right hidden sm:block space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="w-4 h-4" />
    </div>
  </div>
);

export const OrderListSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <OrderItemSkeleton key={i} />
    ))}
  </div>
);
