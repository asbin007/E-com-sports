import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import Sport from "../models/sportModel.js";
import ProductType from "../models/productTypeModel.js";
import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";
import ProductImage from "../models/productImageModel.js";
import ProductAttribute from "../models/productAttributeModel.js";

/* The real catalogue of B. Brothers Sports House, Chaudhary Market, Bardibas.
   Football-first: boots are roughly 70% of the shop's own content, then club
   jerseys and plain team kit, Kelme footballs, a full wall of trophies and
   medals, bags and training wear. No cricket, badminton, basketball,
   volleyball, tennis, running or gym lines — the shop does not stock them. */
const CATEGORIES: {
  name: string;
  slug: string;
  needsSize: boolean;
  sizeType: Category["sizeType"];
}[] = [
  { name: "Football Boots", slug: "football-boots", needsSize: true, sizeType: "shoe" },
  { name: "Club Jerseys", slug: "club-jerseys", needsSize: true, sizeType: "clothing" },
  { name: "Team Kits", slug: "team-kits", needsSize: true, sizeType: "clothing" },
  { name: "Footballs", slug: "footballs", needsSize: true, sizeType: "ball" },
  { name: "Trophies & Medals", slug: "trophies-medals", needsSize: true, sizeType: "trophy" },
  { name: "Training Wear", slug: "training-wear", needsSize: true, sizeType: "clothing" },
  { name: "Bags", slug: "bags", needsSize: false, sizeType: null },
  { name: "Accessories", slug: "accessories", needsSize: false, sizeType: null },
];

const BRANDS = [
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Puma", slug: "puma" },
  { name: "New Balance", slug: "new-balance" },
  { name: "Hummel", slug: "hummel" },
  { name: "Kelme", slug: "kelme" },
  { name: "Anda", slug: "anda" },
  { name: "Mitre", slug: "mitre" },
];

const SPORTS = [
  { name: "Football", slug: "football" },
  { name: "Futsal", slug: "futsal" },
];

const PRODUCT_TYPES: { name: string; slug: string; categorySlug: string }[] = [
  { name: "Firm Ground Boot", slug: "firm-ground-boot", categorySlug: "football-boots" },
  { name: "Turf Boot", slug: "turf-boot", categorySlug: "football-boots" },
  { name: "Indoor/Futsal Boot", slug: "indoor-futsal-boot", categorySlug: "football-boots" },
  { name: "Home Jersey", slug: "home-jersey", categorySlug: "club-jerseys" },
  { name: "Away Jersey", slug: "away-jersey", categorySlug: "club-jerseys" },
  { name: "Third Jersey", slug: "third-jersey", categorySlug: "club-jerseys" },
  { name: "National Team Jersey", slug: "national-team-jersey", categorySlug: "club-jerseys" },
  { name: "Adult Kit Set", slug: "adult-kit-set", categorySlug: "team-kits" },
  { name: "Kids Kit Set", slug: "kids-kit-set", categorySlug: "team-kits" },
  { name: "Match Ball", slug: "match-ball", categorySlug: "footballs" },
  { name: "Training Ball", slug: "training-ball", categorySlug: "footballs" },
  { name: "Trophy", slug: "trophy", categorySlug: "trophies-medals" },
  { name: "Medal", slug: "medal", categorySlug: "trophies-medals" },
  { name: "Jacket", slug: "jacket", categorySlug: "training-wear" },
  { name: "Tracksuit", slug: "tracksuit", categorySlug: "training-wear" },
  { name: "Shorts", slug: "shorts", categorySlug: "training-wear" },
  { name: "Duffel Bag", slug: "duffel-bag", categorySlug: "bags" },
  { name: "Boot Bag", slug: "boot-bag", categorySlug: "bags" },
  { name: "Backpack", slug: "backpack", categorySlug: "bags" },
  { name: "Socks", slug: "socks", categorySlug: "accessories" },
  { name: "Shin Guards", slug: "shin-guards", categorySlug: "accessories" },
  { name: "Goalkeeper Gloves", slug: "goalkeeper-gloves", categorySlug: "accessories" },
];

/* Stock that reads like the shop's own racks: bright and holographic firm-ground
   boots on the wall, Kelme balls above them, club replicas and plain team kit,
   the trophy wall, bags and a couple of jackets. Nepali shelf pricing in Rs.
   Stock is varied on purpose — several sizes are genuinely 0 so the storefront's
   size run has real sold-out sizes to strike through. */
const SAMPLE_PRODUCTS = [
  {
    name: "Nike Mercurial Vapor FG — Pink Blast",
    slug: "nike-mercurial-vapor-fg-pink-blast",
    description:
      "Firm ground Mercurial in the pink blast colourway off the wall rack. Bladed studs, lightweight synthetic upper, built for pace on dry grass pitches.",
    categorySlug: "football-boots",
    brandSlug: "nike",
    sportSlug: "football",
    gender: "Men",
    isFeatured: true,
    allowCustomization: false,
    tags: ["football", "boots", "firm-ground", "nike", "pink"],
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", isThumbnail: true },
      { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", isThumbnail: false },
    ],
    variants: [
      { size: "UK 6", color: "Pink", price: 6500, originalPrice: 7800, stock: 2 },
      { size: "UK 7", color: "Pink", price: 6500, originalPrice: 7800, stock: 4 },
      { size: "UK 8", color: "Pink", price: 6500, originalPrice: 7800, stock: 5 },
      { size: "UK 9", color: "Pink", price: 6500, originalPrice: 7800, stock: 0 },
      { size: "UK 10", color: "Pink", price: 6500, originalPrice: 7800, stock: 3 },
      { size: "UK 11", color: "Pink", price: 6500, originalPrice: 7800, stock: 0 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Firm ground — bladed" },
      { attributeName: "Upper", attributeValue: "Synthetic with textured touch zone" },
      { attributeName: "Surface", attributeValue: "Natural grass" },
    ],
  },
  {
    name: "Adidas X Crazyfast FG — Solar Volt",
    slug: "adidas-x-crazyfast-fg-solar-volt",
    description:
      "Volt and black firm ground boot with a thin synthetic upper and split sole plate. One of the brightest pairs on the rack.",
    categorySlug: "football-boots",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Men",
    isFeatured: true,
    allowCustomization: false,
    tags: ["football", "boots", "firm-ground", "adidas", "volt"],
    images: [
      { url: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 6", color: "Volt", price: 7200, originalPrice: 8500, stock: 0 },
      { size: "UK 7", color: "Volt", price: 7200, originalPrice: 8500, stock: 3 },
      { size: "UK 8", color: "Volt", price: 7200, originalPrice: 8500, stock: 6 },
      { size: "UK 9", color: "Volt", price: 7200, originalPrice: 8500, stock: 4 },
      { size: "UK 10", color: "Volt", price: 7200, originalPrice: 8500, stock: 2 },
      { size: "UK 11", color: "Volt", price: 7200, originalPrice: 8500, stock: 1 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Firm ground — mixed blade and conical" },
      { attributeName: "Upper", attributeValue: "Lightweight synthetic" },
      { attributeName: "Surface", attributeValue: "Natural grass" },
    ],
  },
  {
    name: "Puma Future Play FG — Purple Glimmer",
    slug: "puma-future-play-fg-purple-glimmer",
    description:
      "Holographic purple firm ground boot with a sock-style collar. Conical studs for quick turns on grass.",
    categorySlug: "football-boots",
    brandSlug: "puma",
    sportSlug: "football",
    gender: "Men",
    isFeatured: true,
    allowCustomization: false,
    tags: ["football", "boots", "firm-ground", "puma", "purple", "holographic"],
    images: [
      { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 6", color: "Purple", price: 5800, originalPrice: 6800, stock: 3 },
      { size: "UK 7", color: "Purple", price: 5800, originalPrice: 6800, stock: 5 },
      { size: "UK 8", color: "Purple", price: 5800, originalPrice: 6800, stock: 0 },
      { size: "UK 9", color: "Purple", price: 5800, originalPrice: 6800, stock: 4 },
      { size: "UK 10", color: "Purple", price: 5800, originalPrice: 6800, stock: 2 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Firm ground — conical" },
      { attributeName: "Collar", attributeValue: "Knit sock collar" },
      { attributeName: "Surface", attributeValue: "Natural grass" },
    ],
  },
  {
    name: "New Balance Tekela Magia FG — Multicolour",
    slug: "new-balance-tekela-magia-fg-multicolour",
    description:
      "Laceless-look multicolour firm ground boot with a soft knit upper. Wide fit, popular with players who want room across the forefoot.",
    categorySlug: "football-boots",
    brandSlug: "new-balance",
    sportSlug: "football",
    gender: "Men",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "boots", "firm-ground", "new-balance", "multicolour"],
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 7", color: "Multicolour", price: 4900, originalPrice: 5900, stock: 4 },
      { size: "UK 8", color: "Multicolour", price: 4900, originalPrice: 5900, stock: 3 },
      { size: "UK 9", color: "Multicolour", price: 4900, originalPrice: 5900, stock: 0 },
      { size: "UK 10", color: "Multicolour", price: 4900, originalPrice: 5900, stock: 2 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Firm ground — bladed" },
      { attributeName: "Fit", attributeValue: "Wide forefoot" },
      { attributeName: "Surface", attributeValue: "Natural grass" },
    ],
  },
  {
    name: "Hummel Topstar FG — Orange",
    slug: "hummel-topstar-fg-orange",
    description:
      "Budget firm ground boot in bright orange. Hard-wearing synthetic upper, the pair most local club players leave with.",
    categorySlug: "football-boots",
    brandSlug: "hummel",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "boots", "firm-ground", "hummel", "orange", "budget"],
    images: [
      { url: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 6", color: "Orange", price: 2800, originalPrice: 3400, stock: 6 },
      { size: "UK 7", color: "Orange", price: 2800, originalPrice: 3400, stock: 8 },
      { size: "UK 8", color: "Orange", price: 2800, originalPrice: 3400, stock: 7 },
      { size: "UK 9", color: "Orange", price: 2800, originalPrice: 3400, stock: 5 },
      { size: "UK 10", color: "Orange", price: 2800, originalPrice: 3400, stock: 0 },
      { size: "UK 11", color: "Orange", price: 2800, originalPrice: 3400, stock: 2 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Firm ground — bladed" },
      { attributeName: "Upper", attributeValue: "Synthetic" },
      { attributeName: "Surface", attributeValue: "Natural grass" },
    ],
  },
  {
    name: "Anda Turf Boot — Holographic Silver",
    slug: "anda-turf-boot-holographic-silver",
    description:
      "Short-stud turf boot with a holographic silver upper. Made for the hard and sandy grounds most games around Bardibas are played on.",
    categorySlug: "football-boots",
    brandSlug: "anda",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "boots", "turf", "anda", "holographic"],
    images: [
      { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 6", color: "Silver", price: 2500, originalPrice: 3000, stock: 5 },
      { size: "UK 7", color: "Silver", price: 2500, originalPrice: 3000, stock: 6 },
      { size: "UK 8", color: "Silver", price: 2500, originalPrice: 3000, stock: 4 },
      { size: "UK 9", color: "Silver", price: 2500, originalPrice: 3000, stock: 0 },
      { size: "UK 10", color: "Silver", price: 2500, originalPrice: 3000, stock: 3 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Turf — short rubber studs" },
      { attributeName: "Surface", attributeValue: "Turf and hard ground" },
    ],
  },
  {
    name: "Nike Lunar Gato Indoor Boot — Black/White",
    slug: "nike-lunar-gato-indoor-boot-black-white",
    description:
      "Flat-soled indoor and futsal trainer in black and white. Non-marking gum rubber outsole for hall and cement courts.",
    categorySlug: "football-boots",
    brandSlug: "nike",
    sportSlug: "futsal",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["futsal", "indoor", "boots", "nike"],
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "UK 7", color: "Black", price: 3900, originalPrice: 4600, stock: 3 },
      { size: "UK 8", color: "Black", price: 3900, originalPrice: 4600, stock: 4 },
      { size: "UK 9", color: "Black", price: 3900, originalPrice: 4600, stock: 2 },
      { size: "UK 10", color: "Black", price: 3900, originalPrice: 4600, stock: 0 },
    ],
    attributes: [
      { attributeName: "Stud Type", attributeValue: "Flat — non-marking gum rubber" },
      { attributeName: "Surface", attributeValue: "Indoor court and futsal" },
    ],
  },
  {
    name: "Manchester United 24/25 Away Jersey",
    slug: "manchester-united-24-25-away-jersey",
    description:
      "Replica Manchester United away shirt for the 24/25 season with the Snapdragon front sponsor. Breathable polyester, regular fit.",
    categorySlug: "club-jerseys",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["jersey", "manchester-united", "away", "replica", "24-25"],
    images: [
      { url: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=800", isThumbnail: true },
      { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", isThumbnail: false },
    ],
    variants: [
      { size: "S", color: "White", price: 2400, originalPrice: 2900, stock: 6 },
      { size: "M", color: "White", price: 2400, originalPrice: 2900, stock: 9 },
      { size: "L", color: "White", price: 2400, originalPrice: 2900, stock: 7 },
      { size: "XL", color: "White", price: 2400, originalPrice: 2900, stock: 0 },
      { size: "XXL", color: "White", price: 2400, originalPrice: 2900, stock: 2 },
    ],
    attributes: [
      { attributeName: "Season", attributeValue: "2024/25" },
      { attributeName: "Material", attributeValue: "100% Polyester" },
      { attributeName: "Name & Number", attributeValue: "Printing available in store" },
    ],
  },
  {
    name: "Real Madrid 24/25 Third Jersey — Green",
    slug: "real-madrid-24-25-third-jersey-green",
    description:
      "Replica Real Madrid third shirt in green with the Emirates Fly Better front sponsor. The one worn most often behind the counter.",
    categorySlug: "club-jerseys",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["jersey", "real-madrid", "third", "replica", "24-25", "green"],
    images: [
      { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Green", price: 2400, originalPrice: 2900, stock: 5 },
      { size: "M", color: "Green", price: 2400, originalPrice: 2900, stock: 8 },
      { size: "L", color: "Green", price: 2400, originalPrice: 2900, stock: 6 },
      { size: "XL", color: "Green", price: 2400, originalPrice: 2900, stock: 3 },
      { size: "XXL", color: "Green", price: 2400, originalPrice: 2900, stock: 0 },
    ],
    attributes: [
      { attributeName: "Season", attributeValue: "2024/25" },
      { attributeName: "Material", attributeValue: "100% Polyester" },
      { attributeName: "Name & Number", attributeValue: "Printing available in store" },
    ],
  },
  {
    name: "Spain National Team Home Jersey",
    slug: "spain-national-team-home-jersey",
    description:
      "Spain national team home shirt in white with red trim. Stocked for supporters and five-a-side sides who want a plain light kit.",
    categorySlug: "club-jerseys",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: true,
    tags: ["jersey", "spain", "national-team", "replica"],
    images: [
      { url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "White", price: 2200, originalPrice: 2600, stock: 4 },
      { size: "M", color: "White", price: 2200, originalPrice: 2600, stock: 6 },
      { size: "L", color: "White", price: 2200, originalPrice: 2600, stock: 5 },
      { size: "XL", color: "White", price: 2200, originalPrice: 2600, stock: 0 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "100% Polyester" },
      { attributeName: "Name & Number", attributeValue: "Printing available in store" },
    ],
  },
  {
    name: "Club Team Kit Set — Jersey & Shorts",
    slug: "club-team-kit-set-jersey-shorts",
    description:
      "Plain jersey and shorts set for local club sides, boxed per player. Numbers and a club name can be printed in store before you collect.",
    categorySlug: "team-kits",
    brandSlug: "anda",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["team-kit", "kit-set", "teamwear", "jersey-and-shorts"],
    images: [
      { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Pink", price: 1800, originalPrice: 2200, stock: 8 },
      { size: "M", color: "Pink", price: 1800, originalPrice: 2200, stock: 10 },
      { size: "L", color: "Pink", price: 1800, originalPrice: 2200, stock: 7 },
      { size: "XL", color: "Pink", price: 1800, originalPrice: 2200, stock: 0 },
      { size: "M", color: "Sky Blue", price: 1800, originalPrice: 2200, stock: 9 },
      { size: "L", color: "Sky Blue", price: 1800, originalPrice: 2200, stock: 6 },
      { size: "M", color: "Yellow", price: 1800, originalPrice: 2200, stock: 5 },
      { size: "L", color: "Yellow", price: 1800, originalPrice: 2200, stock: 0 },
      { size: "M", color: "Black", price: 1800, originalPrice: 2200, stock: 7 },
      { size: "L", color: "Black", price: 1800, originalPrice: 2200, stock: 4 },
    ],
    attributes: [
      { attributeName: "Includes", attributeValue: "Jersey and shorts" },
      { attributeName: "Material", attributeValue: "Polyester mesh" },
      { attributeName: "Printing", attributeValue: "Club name and numbers available" },
    ],
  },
  {
    name: "Kids Team Kit Set — Jersey & Shorts",
    slug: "kids-team-kit-set-jersey-shorts",
    description:
      "The same plain kit set cut for school and academy sides. Sold per player with printing available in store.",
    categorySlug: "team-kits",
    brandSlug: "anda",
    sportSlug: "football",
    gender: "Kids",
    isFeatured: false,
    allowCustomization: true,
    tags: ["team-kit", "kit-set", "kids", "teamwear"],
    images: [
      { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "XS", color: "Sky Blue", price: 1500, originalPrice: 1800, stock: 6 },
      { size: "S", color: "Sky Blue", price: 1500, originalPrice: 1800, stock: 8 },
      { size: "M", color: "Sky Blue", price: 1500, originalPrice: 1800, stock: 0 },
      { size: "XS", color: "Red", price: 1500, originalPrice: 1800, stock: 5 },
      { size: "S", color: "Red", price: 1500, originalPrice: 1800, stock: 4 },
    ],
    attributes: [
      { attributeName: "Includes", attributeValue: "Jersey and shorts" },
      { attributeName: "Material", attributeValue: "Polyester mesh" },
    ],
  },
  {
    name: "Kelme Match Football",
    slug: "kelme-match-football",
    description:
      "Kelme match ball off the wall display above the boot racks. Thermal-bonded panels, holds its shape and pressure through a full season.",
    categorySlug: "footballs",
    brandSlug: "kelme",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: false,
    tags: ["football", "ball", "kelme", "match"],
    images: [
      { url: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Size 4", color: "White/Blue", price: 2900, originalPrice: 3400, stock: 6 },
      { size: "Size 5", color: "White/Blue", price: 3200, originalPrice: 3800, stock: 9 },
      { size: "Size 5", color: "Orange", price: 3200, originalPrice: 3800, stock: 0 },
    ],
    attributes: [
      { attributeName: "Construction", attributeValue: "Thermal bonded" },
      { attributeName: "Use", attributeValue: "Match" },
    ],
  },
  {
    name: "Kelme Training Football",
    slug: "kelme-training-football",
    description:
      "Machine-stitched Kelme training ball in three sizes. The everyday ball for school grounds and club practice.",
    categorySlug: "footballs",
    brandSlug: "kelme",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "ball", "kelme", "training"],
    images: [
      { url: "https://images.unsplash.com/photo-1548204560-3d8af91d3dc4?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Size 3", color: "Multicolour", price: 1500, originalPrice: 1800, stock: 10 },
      { size: "Size 4", color: "Multicolour", price: 1600, originalPrice: 1900, stock: 12 },
      { size: "Size 5", color: "Multicolour", price: 1800, originalPrice: 2100, stock: 14 },
      { size: "Size 5", color: "Green", price: 1800, originalPrice: 2100, stock: 0 },
    ],
    attributes: [
      { attributeName: "Construction", attributeValue: "Machine stitched" },
      { attributeName: "Use", attributeValue: "Training" },
    ],
  },
  {
    name: "Mitre Impel Training Football",
    slug: "mitre-impel-training-football",
    description:
      "Hard-wearing Mitre training ball for rough and gravelly grounds. Thicker rubber bladder, holds up to daily use.",
    categorySlug: "footballs",
    brandSlug: "mitre",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "ball", "mitre", "training", "durable"],
    images: [
      { url: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Size 4", color: "White/Black", price: 1500, originalPrice: 1800, stock: 7 },
      { size: "Size 5", color: "White/Black", price: 1700, originalPrice: 2000, stock: 11 },
    ],
    attributes: [
      { attributeName: "Construction", attributeValue: "Machine stitched" },
      { attributeName: "Use", attributeValue: "Training" },
    ],
  },
  {
    name: "Gold Cup Trophy",
    slug: "gold-cup-trophy",
    description:
      "Gold cup trophy off the trophy wall, in heights from a 6 inch runner-up cup to a 24 inch tournament winner. Engraving on the plate available in store.",
    categorySlug: "trophies-medals",
    brandSlug: "anda",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["trophy", "cup", "gold", "tournament", "dashain"],
    images: [
      { url: "https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "6 in", color: "Gold", price: 800, originalPrice: 1000, stock: 12 },
      { size: "8 in", color: "Gold", price: 1100, originalPrice: 1400, stock: 10 },
      { size: "10 in", color: "Gold", price: 1600, originalPrice: 2000, stock: 8 },
      { size: "12 in", color: "Gold", price: 2200, originalPrice: 2700, stock: 6 },
      { size: "16 in", color: "Gold", price: 3400, originalPrice: 4000, stock: 0 },
      { size: "20 in", color: "Gold", price: 4600, originalPrice: 5400, stock: 3 },
      { size: "24 in", color: "Gold", price: 6000, originalPrice: 7000, stock: 0 },
    ],
    attributes: [
      { attributeName: "Finish", attributeValue: "Gold plated" },
      { attributeName: "Engraving", attributeValue: "Name plate engraving available" },
    ],
  },
  {
    name: "Silver Cup Trophy",
    slug: "silver-cup-trophy",
    description:
      "Silver finish cup for runners-up and age-group prizes. Stocked in the same heights as the gold line.",
    categorySlug: "trophies-medals",
    brandSlug: "anda",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: true,
    tags: ["trophy", "cup", "silver", "tournament"],
    images: [
      { url: "https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "8 in", color: "Silver", price: 900, originalPrice: 1200, stock: 9 },
      { size: "10 in", color: "Silver", price: 1300, originalPrice: 1700, stock: 7 },
      { size: "12 in", color: "Silver", price: 1900, originalPrice: 2300, stock: 0 },
      { size: "16 in", color: "Silver", price: 2900, originalPrice: 3500, stock: 4 },
    ],
    attributes: [
      { attributeName: "Finish", attributeValue: "Silver plated" },
      { attributeName: "Engraving", attributeValue: "Name plate engraving available" },
    ],
  },
  {
    name: "Medal with Ribbon",
    slug: "medal-with-ribbon",
    description:
      "Gold, silver and bronze medals on a neck ribbon, sold loose or bagged by the dozen for tournaments.",
    categorySlug: "trophies-medals",
    brandSlug: "anda",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["medal", "ribbon", "tournament", "prize"],
    images: [
      { url: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "One Size", color: "Gold", price: 250, originalPrice: 320, stock: 60 },
      { size: "One Size", color: "Silver", price: 250, originalPrice: 320, stock: 48 },
      { size: "One Size", color: "Bronze", price: 250, originalPrice: 320, stock: 0 },
    ],
    attributes: [
      { attributeName: "Includes", attributeValue: "Neck ribbon" },
      { attributeName: "Bulk", attributeValue: "Dozen packs available" },
    ],
  },
  {
    name: "Nike Brasilia Duffel Bag",
    slug: "nike-brasilia-duffel-bag",
    description:
      "Nike duffel with a wet or boot compartment at one end and a padded shoulder strap. The bag most players pick up with their first pair of boots.",
    categorySlug: "bags",
    brandSlug: "nike",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["bag", "duffel", "nike", "training"],
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", isThumbnail: true },
    ],
    variants: [
      { size: null, color: "Black", price: 2800, originalPrice: 3300, stock: 7 },
      { size: null, color: "Navy", price: 2800, originalPrice: 3300, stock: 4 },
      { size: null, color: "Red", price: 2800, originalPrice: 3300, stock: 0 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Polyester" },
      { attributeName: "Feature", attributeValue: "Separate boot compartment" },
    ],
  },
  {
    name: "Adidas Tiro Duffel Bag",
    slug: "adidas-tiro-duffel-bag",
    description:
      "Adidas Tiro duffel in black with three stripes on the side panel. Big enough for a full kit, boots and a ball.",
    categorySlug: "bags",
    brandSlug: "adidas",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["bag", "duffel", "adidas", "training"],
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", isThumbnail: true },
    ],
    variants: [
      { size: null, color: "Black", price: 2400, originalPrice: 2900, stock: 6 },
      { size: null, color: "Grey", price: 2400, originalPrice: 2900, stock: 3 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Polyester" },
      { attributeName: "Feature", attributeValue: "Side ventilation panel" },
    ],
  },
  {
    name: "Nike Boot Bag — Blue",
    slug: "nike-boot-bag-blue",
    description:
      "Small blue drawstring boot bag. Keeps a muddy pair away from the rest of the kit on the ride home.",
    categorySlug: "bags",
    brandSlug: "nike",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["bag", "boot-bag", "nike"],
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", isThumbnail: true },
    ],
    variants: [
      { size: null, color: "Blue", price: 1200, originalPrice: 1500, stock: 12 },
      { size: null, color: "Black", price: 1200, originalPrice: 1500, stock: 8 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Polyester" },
      { attributeName: "Closure", attributeValue: "Drawstring" },
    ],
  },
  {
    name: "Adidas Tiro Training Jacket",
    slug: "adidas-tiro-training-jacket",
    description:
      "Full-zip training jacket off the rack by the door. Light enough for warm-ups, holds up through the cold months.",
    categorySlug: "training-wear",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Men",
    isFeatured: false,
    allowCustomization: false,
    tags: ["training-wear", "jacket", "adidas"],
    images: [
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Black", price: 2900, originalPrice: 3500, stock: 4 },
      { size: "M", color: "Black", price: 2900, originalPrice: 3500, stock: 6 },
      { size: "L", color: "Black", price: 2900, originalPrice: 3500, stock: 5 },
      { size: "XL", color: "Black", price: 2900, originalPrice: 3500, stock: 0 },
      { size: "M", color: "Navy", price: 2900, originalPrice: 3500, stock: 3 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Recycled polyester" },
      { attributeName: "Feature", attributeValue: "Full zip with side pockets" },
    ],
  },
  {
    name: "Nike Academy Windbreaker",
    slug: "nike-academy-windbreaker",
    description:
      "Lightweight windbreaker for touchline and travel. Packs down small enough to live in a kit bag.",
    categorySlug: "training-wear",
    brandSlug: "nike",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["training-wear", "windbreaker", "jacket", "nike"],
    images: [
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Black", price: 3200, originalPrice: 3800, stock: 3 },
      { size: "M", color: "Black", price: 3200, originalPrice: 3800, stock: 5 },
      { size: "L", color: "Black", price: 3200, originalPrice: 3800, stock: 0 },
      { size: "XL", color: "Black", price: 3200, originalPrice: 3800, stock: 2 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Woven polyester" },
      { attributeName: "Feature", attributeValue: "Packable" },
    ],
  },
];

export async function seedAll(): Promise<void> {
  console.log("🌱 Seeding database...");

  // 1. Seed Categories
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const [record] = await Category.findOrCreate({
      where: { slug: cat.slug },
      defaults: { name: cat.name, slug: cat.slug, needsSize: cat.needsSize, sizeType: cat.sizeType },
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`);

  // 2. Seed Brands
  const brandMap = new Map<string, string>();
  for (const brand of BRANDS) {
    const [record] = await Brand.findOrCreate({
      where: { slug: brand.slug },
      defaults: { name: brand.name, slug: brand.slug },
    });
    brandMap.set(brand.slug, record.id);
  }
  console.log(`✅ ${BRANDS.length} brands seeded`);

  // 3. Seed Sports
  const sportMap = new Map<string, string>();
  for (const sport of SPORTS) {
    const [record] = await Sport.findOrCreate({
      where: { slug: sport.slug },
      defaults: { name: sport.name, slug: sport.slug },
    });
    sportMap.set(sport.slug, record.id);
  }
  console.log(`✅ ${SPORTS.length} sports seeded`);

  // 4. Seed Product Types
  const productTypeMap = new Map<string, string>();
  for (const pt of PRODUCT_TYPES) {
    const categoryId = categoryMap.get(pt.categorySlug);
    if (!categoryId) continue;
    const [record] = await ProductType.findOrCreate({
      where: { slug: pt.slug },
      defaults: { name: pt.name, slug: pt.slug, categoryId },
    });
    productTypeMap.set(pt.slug, record.id);
  }
  console.log(`✅ ${PRODUCT_TYPES.length} product types seeded`);

  // 5. Seed Sample Products
  let productCount = 0;
  for (const prod of SAMPLE_PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug);
    const brandId = brandMap.get(prod.brandSlug);
    if (!categoryId || !brandId) continue;

    const [product] = await Product.findOrCreate({
      where: { slug: prod.slug },
      defaults: {
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        categoryId,
        brandId,
        sportId: prod.sportSlug ? sportMap.get(prod.sportSlug) || null : null,
        gender: prod.gender,
        isActive: true,
        isFeatured: prod.isFeatured,
        allowCustomization: prod.allowCustomization,
        tags: prod.tags,
      },
    });

    // Create variants
    const existingVariants = await Variant.count({ where: { productId: product.id } });
    if (existingVariants === 0) {
      for (const v of prod.variants) {
        await Variant.create({
          productId: product.id,
          size: v.size,
          color: v.color,
          price: v.price,
          originalPrice: v.originalPrice || null,
          stock: v.stock,
          isActive: true,
        });
      }
    }

    // Create attributes
    const existingAttrs = await ProductAttribute.count({ where: { productId: product.id } });
    if (existingAttrs === 0) {
      for (const a of prod.attributes) {
        await ProductAttribute.create({
          productId: product.id,
          attributeName: a.attributeName,
          attributeValue: a.attributeValue,
        });
      }
    }

    // Create images
    const existingImages = await ProductImage.count({ where: { productId: product.id } });
    if (existingImages === 0 && prod.images && prod.images.length > 0) {
      for (let i = 0; i < prod.images.length; i++) {
        const img = prod.images[i];
        if (img) {
          await ProductImage.create({
            productId: product.id,
            url: img.url,
            altText: prod.name,
            isThumbnail: img.isThumbnail,
            sortOrder: i,
          });
        }
      }
    }

    productCount++;
  }
  console.log(`✅ ${productCount} sample products seeded`);

  console.log("🎉 Database seeding complete!");
}
