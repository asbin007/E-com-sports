import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, Heart, Play, Users } from "lucide-react";
import tiktok from "../../data/tiktok.json";
import { STORE } from "../../data/store";
import TikTokIcon from "../ui/TikTokIcon";

/** cubic-bezier(.2,.7,.3,1) — the one easing in the system. */
const EASE_SNAP: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

// Static snapshot of the TikTok profile; refresh with `npm run tiktok:refresh` (scripts/fetch-tiktok.mjs),
// which also downloads the cover images into public/tiktok/ (served as /tiktok/<id>.jpg).
const compact = new Intl.NumberFormat("en", { notation: "compact" });

// Only these ids have a downloaded cover, so nothing else can render a broken image.
const COVER_IDS = [
  "7687996197952326920",
  "7610007241290272008",
  "7694307813278944520",
  "7552485728073141511",
  "7682050129066609928",
  "7693921831442451720",
];

const topVideos = tiktok.videos
  .filter((video) => COVER_IDS.includes(video.id))
  .sort((a, b) => (b.views ?? -1) - (a.views ?? -1))
  .slice(0, 3);

const stats = [
  { icon: Users, label: "Followers", value: tiktok.stats.followers },
  { icon: Heart, label: "Likes", value: tiktok.stats.likes },
  { icon: Play, label: "Videos", value: tiktok.stats.videos },
];

const TikTokFeed = () => {
  const reduce = useReducedMotion();

  return (
    <section className="bg-secondary py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <motion.div
          // Mount-driven: a header below the fold must never wait on an observer.
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: EASE_SNAP }}
          className="mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end"
        >
          <div>
            <p className="eyebrow">COD available · Delivery all over Nepal</p>
            <h2
              className="mt-3 font-display font-semibold uppercase leading-none text-primary"
              style={{ fontSize: "clamp(34px,6vw,56px)" }}
            >
              See it in action
            </h2>
            <a
              href={STORE.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent transition duration-snap ease-snap hover:text-accent-hover"
            >
              <TikTokIcon className="h-4 w-4" aria-hidden="true" />@{STORE.tiktokHandle}
            </a>
          </div>

          <dl className="flex gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-card border-2 border-inverse bg-card px-5 py-3 text-center"
              >
                <stat.icon className="mx-auto mb-1 h-4 w-4 text-accent" aria-hidden="true" />
                <dd className="font-display text-2xl font-bold leading-none tabular-nums text-primary">
                  {compact.format(stat.value)}
                </dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-tertiary">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </motion.div>

        <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-3">
          {topVideos.map((video, idx) => (
            <motion.a
              key={video.id}
              // Opacity only: animating `y` would leave framer's inline
              // transform on the tile and the hover lift below could not apply.
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16, ease: EASE_SNAP, delay: idx * 0.04 }}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch on TikTok: ${video.caption.slice(0, 60)}`}
              className="relative block aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-card border-2 border-inverse bg-black transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <img
                src={`/tiktok/${video.id}.jpg`}
                alt=""
                width={576}
                height={1024}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-tag border-2 border-white/60 bg-black/55">
                  <Play className="h-5 w-5 fill-white text-white" aria-hidden="true" />
                </span>
              </span>
              {typeof video.views === "number" && (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-tag bg-black/70 px-2 py-1 font-display text-sm font-bold leading-none tabular-nums text-white">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  {compact.format(video.views)}
                </span>
              )}
            </motion.a>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={STORE.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-tag border-2 border-inverse bg-inverse px-6 font-display text-lg font-semibold uppercase leading-none text-inverse transition duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
          >
            <TikTokIcon className="h-4 w-4" aria-hidden="true" />
            Follow on TikTok
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default TikTokFeed;
