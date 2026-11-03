// Refreshes src/data/tiktok.json from the shop's TikTok profile via Apify,
// plus the cover images in public/tiktok/ used by src/components/home/TikTokFeed.tsx.
// Usage: APIFY_TOKEN=xxx npm run tiktok:refresh   (optional TIKTOK_HANDLE=someone)
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

const OUT = new URL("../src/data/tiktok.json", import.meta.url);
const COVERS_DIR = new URL("../public/tiktok/", import.meta.url);
const COVER_COUNT = 6;
const ACTOR = "clockworks~tiktok-profile-scraper";
const TIMEOUT_MS = 5 * 60 * 1000;

const token = process.env.APIFY_TOKEN;
if (!token) {
  console.error("APIFY_TOKEN is not set. Create one at https://console.apify.com/account/integrations, then run: APIFY_TOKEN=... npm run tiktok:refresh");
  process.exit(1);
}
const handle = (process.env.TIKTOK_HANDLE || "b.brotherssportshouse07").replace(/^@/, "");

const existing = JSON.parse(await readFile(OUT, "utf8"));

const fetchItems = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profiles: [handle],
          resultsPerPage: 40,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) throw new Error(`Apify responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
    return await res.json();
  } catch (err) {
    if (err?.name === "AbortError") throw new Error(`Apify run timed out after ${TIMEOUT_MS / 60000} minutes`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

let items;
try {
  items = await fetchItems();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
if (!Array.isArray(items) || items.length === 0) {
  console.error("Apify returned no items; tiktok.json left unchanged.");
  process.exit(1);
}

const num = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const str = (v, fallback) => (typeof v === "string" && v.trim() ? v : fallback);
const toIntl = (digits) => (digits.length === 10 ? `977${digits}` : digits);

const author = items.find((i) => i?.authorMeta)?.authorMeta ?? {};
const bio = str(author.signature, existing.profile.bio);
const whatsappInBio = bio.match(/whats\s*app\s*no\.?\s*:?\s*(\d{7,15})/i)?.[1];
const phoneInBio = bio.match(/contact\s*no\.?\s*:?\s*(\d{7,15})/i)?.[1];
const profileHandle = str(author.name, handle);

const videos = items
  .filter((i) => i?.id && typeof i.webVideoUrl === "string")
  .map((i) => ({
    id: String(i.id),
    url: i.webVideoUrl,
    views: typeof i.playCount === "number" ? i.playCount : null,
    caption: str(i.text, ""),
  }));

const data = {
  fetchedAt: new Date().toISOString().slice(0, 10),
  source: `apify ${ACTOR.replace("~", "/")} (refresh with scripts/fetch-tiktok.mjs)`,
  profile: {
    handle: profileHandle,
    name: str(author.nickName, existing.profile.name),
    url: `https://www.tiktok.com/@${profileHandle}`,
    bio,
    facebook: existing.profile.facebook,
    whatsapp: whatsappInBio ? toIntl(whatsappInBio) : existing.profile.whatsapp,
    phone: phoneInBio ? toIntl(phoneInBio) : existing.profile.phone,
    location: existing.profile.location,
  },
  stats: {
    followers: num(author.fans, existing.stats.followers),
    following: num(author.following, existing.stats.following),
    likes: num(author.heart, existing.stats.likes),
    videos: num(author.video, existing.stats.videos),
  },
  videos: videos.length ? videos : existing.videos,
};

await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`);

// The feed renders local covers instead of TikTok embeds, so keep one jpg per top video and drop the rest.
const coverUrlOf = (item) =>
  [
    Array.isArray(item.covers) ? item.covers[0] : item.covers,
    item.videoMeta?.coverUrl,
    item.videoMeta?.originalCoverUrl,
  ].find((url) => typeof url === "string" && url.startsWith("http"));

const topVideos = [...data.videos].sort((a, b) => (b.views ?? -1) - (a.views ?? -1)).slice(0, COVER_COUNT);
const itemsById = new Map(items.filter((i) => i?.id).map((i) => [String(i.id), i]));
await mkdir(COVERS_DIR, { recursive: true });

for (const video of topVideos) {
  const url = coverUrlOf(itemsById.get(video.id) ?? {});
  if (!url) {
    console.log(`cover skipped for ${video.id}: no cover url on the Apify item`);
    continue;
  }
  try {
    const res = await fetch(url, {
      headers: { referer: "https://www.tiktok.com/", "user-agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`responded ${res.status}`);
    await writeFile(new URL(`${video.id}.jpg`, COVERS_DIR), new Uint8Array(await res.arrayBuffer()));
  } catch (err) {
    console.log(`cover skipped for ${video.id}: ${err instanceof Error ? err.message : err}`);
  }
}

const keep = new Set(topVideos.map((video) => `${video.id}.jpg`));
for (const name of await readdir(COVERS_DIR)) {
  if (name.endsWith(".jpg") && !keep.has(name)) await rm(new URL(name, COVERS_DIR));
}

console.log(
  `tiktok.json updated: @${data.profile.handle}, ${data.stats.followers} followers, ${data.stats.likes} likes, ${data.videos.length} videos`
);
