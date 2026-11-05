import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * Flat token-coloured rectangle with the shimmer sweeping across it. The
 * gradient is written as a `linear-gradient` over the CSS custom properties
 * because Tailwind's `from-*`/`via-*` stops resolve from `theme.colors`, which
 * this config only extends with accent, marigold and pitch — the previous
 * `from-secondary via-tertiary to-secondary` produced no gradient at all, so
 * the shimmer animated nothing.
 */
export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={cn(
      "rounded-card bg-secondary animate-shimmer bg-[length:200%_100%]",
      "bg-[linear-gradient(90deg,rgb(var(--color-bg-secondary))_0%,rgb(var(--color-bg-tertiary))_50%,rgb(var(--color-bg-secondary))_100%)]",
      className
    )}
  />
);

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-card border-2 border-border-primary bg-card">
    <Skeleton className="aspect-[4/5] rounded-none" />
    <div className="space-y-2 p-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-5 w-24" />
      <div className="flex gap-1.5 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-11 rounded-tag" />
        ))}
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-tag" />
        <Skeleton className="h-5 w-16 rounded-tag" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-primary">
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 py-4">
        <Skeleton className="h-4 w-12" />
        <span className="text-muted">/</span>
        <Skeleton className="h-4 w-10" />
        <span className="text-muted">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-40" />
          <div className="rule-section my-6 opacity-20" />
          <Skeleton className="mb-3 h-4 w-16" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-12 rounded-tag" />
            ))}
          </div>
          <Skeleton className="mb-3 mt-5 h-4 w-16" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-20 rounded-tag" />
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-12 w-32 rounded-tag" />
            <Skeleton className="h-12 flex-1 rounded-tag" />
            <Skeleton className="h-12 w-12 rounded-tag" />
          </div>
          <Skeleton className="mt-2 h-12 w-full rounded-tag" />
          <div className="mt-6 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const HeroSkeleton = () => (
  <section className="relative border-b-[3px] border-inverse bg-primary">
    <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Skeleton className="h-6 w-48 rounded-tag" />
          <Skeleton className="h-16 w-full max-w-lg" />
          <Skeleton className="h-16 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <Skeleton className="h-5 w-3/4 max-w-md" />
          <div className="mt-7 flex gap-3">
            <Skeleton className="h-12 w-44 rounded-tag" />
            <Skeleton className="h-12 w-44 rounded-tag" />
          </div>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="aspect-[5/4]" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const CartItemSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-card border-2 border-border-primary bg-card p-4 sm:flex-row sm:gap-6 sm:p-6">
    <Skeleton className="h-36 w-full flex-shrink-0 sm:h-32 sm:w-32" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-tag" />
            <Skeleton className="h-6 w-20 rounded-tag" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-tag" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-11 w-28 rounded-tag" />
        <Skeleton className="h-6 w-28" />
      </div>
    </div>
  </div>
);

export const CartSkeleton = () => (
  <div className="min-h-screen bg-primary pb-20 pt-4">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b-[3px] border-inverse py-8 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
          <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-4 rounded-card border-2 border-border-primary bg-card p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="border-t border-border-primary pt-4">
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-tag" />
            <Skeleton className="mx-auto h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SpecialOffersSkeleton = () => (
  <section className="band py-20">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <Skeleton className="h-12 w-64 bg-primary/10" />
          <Skeleton className="h-4 w-80 bg-primary/5" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-tag bg-primary/10" />
          <Skeleton className="h-12 w-12 rounded-tag bg-primary/10" />
        </div>
      </div>
      <Skeleton className="h-[450px] bg-primary/5" />
      <div className="mt-8 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8 rounded-tag bg-primary/10" />
        ))}
      </div>
    </div>
  </section>
);

export const OrderItemSkeleton = () => (
  <div className="flex items-center justify-between rounded-card border-2 border-border-primary bg-card p-4 sm:p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-tag" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-tag" />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="hidden space-y-1 text-right sm:block">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-4" />
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
