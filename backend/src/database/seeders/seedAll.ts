import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import Sport from "../models/sportModel.js";
import ProductType from "../models/productTypeModel.js";
import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";
import ProductImage from "../models/productImageModel.js";
import ProductAttribute from "../models/productAttributeModel.js";

const CATEGORIES = [
  { name: "Jerseys", slug: "jerseys", needsSize: true, sizeType: "clothing" },
  { name: "Shoes", slug: "shoes", needsSize: true, sizeType: "shoe" },
  { name: "Cricket Equipment", slug: "cricket-equipment", needsSize: true, sizeType: "weight" },
  { name: "Football Equipment", slug: "football-equipment", needsSize: true, sizeType: "equipment" },
  { name: "Accessories", slug: "accessories", needsSize: false, sizeType: null },
  { name: "Sportswear", slug: "sportswear", needsSize: true, sizeType: "clothing" },
];

const BRANDS = [
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Puma", slug: "puma" },
  { name: "SS Cricket", slug: "ss-cricket" },
  { name: "SG Cricket", slug: "sg-cricket" },
  { name: "Yonex", slug: "yonex" },
  { name: "Mitre", slug: "mitre" },
  { name: "Nivia", slug: "nivia" },
];

const SPORTS = [
  { name: "Football", slug: "football" },
  { name: "Cricket", slug: "cricket" },
  { name: "Basketball", slug: "basketball" },
  { name: "Volleyball", slug: "volleyball" },
  { name: "Badminton", slug: "badminton" },
  { name: "Tennis", slug: "tennis" },
  { name: "Running", slug: "running" },
];

const PRODUCT_TYPES: { name: string; slug: string; categorySlug: string }[] = [
  { name: "Jersey", slug: "jersey", categorySlug: "jerseys" },
  { name: "Kit", slug: "kit", categorySlug: "jerseys" },
  { name: "Football Boot", slug: "football-boot", categorySlug: "shoes" },
  { name: "Cricket Shoe", slug: "cricket-shoe", categorySlug: "shoes" },
  { name: "Running Shoe", slug: "running-shoe", categorySlug: "shoes" },
  { name: "Bat", slug: "bat", categorySlug: "cricket-equipment" },
  { name: "Ball", slug: "ball", categorySlug: "cricket-equipment" },
  { name: "Pad", slug: "pad", categorySlug: "cricket-equipment" },
  { name: "Glove", slug: "glove", categorySlug: "cricket-equipment" },
  { name: "Football", slug: "football", categorySlug: "football-equipment" },
  { name: "Shin Guard", slug: "shin-guard", categorySlug: "football-equipment" },
  { name: "Bag", slug: "bag", categorySlug: "accessories" },
  { name: "Cap", slug: "cap", categorySlug: "accessories" },
  { name: "Socks", slug: "socks", categorySlug: "accessories" },
  { name: "Tracksuit", slug: "tracksuit", categorySlug: "sportswear" },
  { name: "Shorts", slug: "shorts", categorySlug: "sportswear" },
  { name: "Training Wear", slug: "training-wear", categorySlug: "sportswear" },
];

const SAMPLE_PRODUCTS = [
  {
    name: "Nepal National Team Jersey 2024",
    slug: "nepal-national-team-jersey-2024",
    description: "Official Nepal national football team jersey. Lightweight, breathable fabric with moisture-wicking technology.",
    categorySlug: "jerseys",
    brandSlug: "nike",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["nepal", "football", "national-team", "jersey"],
    images: [
      { url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800", isThumbnail: true },
      { url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800", isThumbnail: false },
    ],
    variants: [
      { size: "S", color: "Blue", price: 2500, originalPrice: 3000, stock: 10 },
      { size: "M", color: "Blue", price: 2500, originalPrice: 3000, stock: 15 },
      { size: "L", color: "Blue", price: 2500, originalPrice: 3000, stock: 12 },
      { size: "XL", color: "Blue", price: 2500, originalPrice: 3000, stock: 8 },
      { size: "S", color: "Red", price: 2500, originalPrice: 3000, stock: 5 },
      { size: "M", color: "Red", price: 2500, originalPrice: 3000, stock: 10 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "100% Polyester" },
      { attributeName: "Feature", attributeValue: "Moisture-wicking" },
      { attributeName: "Feature", attributeValue: "Breathable mesh" },
    ],
  },
  {
    name: "Manchester United Home Jersey 2024",
    slug: "manchester-united-home-jersey-2024",
    description: "Official Manchester United home jersey for the 2024 season. Classic red design with modern performance fabric.",
    categorySlug: "jerseys",
    brandSlug: "adidas",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: true,
    tags: ["man-utd", "football", "club", "jersey", "premier-league"],
    images: [
      { url: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Red", price: 3500, originalPrice: 4500, stock: 8 },
      { size: "M", color: "Red", price: 3500, originalPrice: 4500, stock: 12 },
      { size: "L", color: "Red", price: 3500, originalPrice: 4500, stock: 10 },
      { size: "XL", color: "Red", price: 3500, originalPrice: 4500, stock: 6 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Primegreen recycled polyester" },
      { attributeName: "Feature", attributeValue: "AEROREADY moisture management" },
    ],
  },
  {
    name: "SS Cricket Bat — English Willow",
    slug: "ss-cricket-bat-english-willow",
    description: "Premium English Willow cricket bat. Handcrafted with excellent grain structure for powerful shots.",
    categorySlug: "cricket-equipment",
    brandSlug: "ss-cricket",
    sportSlug: "cricket",
    gender: "Unisex",
    isFeatured: true,
    allowCustomization: false,
    tags: ["cricket", "bat", "english-willow", "premium"],
    images: [
      { url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Short Handle", color: null, price: 15000, originalPrice: 18000, stock: 5 },
      { size: "Long Handle", color: null, price: 16000, originalPrice: 19000, stock: 3 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "English Willow" },
      { attributeName: "Grade", attributeValue: "Grade 1" },
      { attributeName: "Weight", attributeValue: "2lb 8oz - 2lb 12oz" },
      { attributeName: "Feature", attributeValue: "Handcrafted" },
    ],
  },
  {
    name: "Nike Mercurial Football Boot",
    slug: "nike-mercurial-football-boot",
    description: "Lightweight speed boot designed for fast players. Flyknit upper with All Conditions Control technology.",
    categorySlug: "shoes",
    brandSlug: "nike",
    sportSlug: "football",
    gender: "Men",
    isFeatured: true,
    allowCustomization: false,
    tags: ["football", "boots", "nike", "mercurial", "speed"],
    images: [
      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", isThumbnail: true },
      { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", isThumbnail: false },
    ],
    variants: [
      { size: "UK 7", color: "Black", price: 12000, originalPrice: 15000, stock: 4 },
      { size: "UK 8", color: "Black", price: 12000, originalPrice: 15000, stock: 6 },
      { size: "UK 9", color: "Black", price: 12000, originalPrice: 15000, stock: 5 },
      { size: "UK 10", color: "Black", price: 12000, originalPrice: 15000, stock: 3 },
      { size: "UK 8", color: "White", price: 12000, originalPrice: 15000, stock: 4 },
      { size: "UK 9", color: "White", price: 12000, originalPrice: 15000, stock: 3 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Flyknit upper" },
      { attributeName: "Feature", attributeValue: "All Conditions Control" },
      { attributeName: "Feature", attributeValue: "Anti-clog traction" },
    ],
  },
  {
    name: "Mitre Football — Size 5",
    slug: "mitre-football-size-5",
    description: "Official match football. FIFA approved for competitive play.",
    categorySlug: "football-equipment",
    brandSlug: "mitre",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "ball", "match", "fifa-approved"],
    images: [
      { url: "https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Size 5", color: "White", price: 3500, originalPrice: 4000, stock: 20 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "PU Leather" },
      { attributeName: "Feature", attributeValue: "FIFA Approved" },
    ],
  },
  {
    name: "Nivia Storm Football",
    slug: "nivia-storm-football",
    description: "Durable training football suitable for all surfaces. Machine-stitched for consistent performance.",
    categorySlug: "football-equipment",
    brandSlug: "nivia",
    sportSlug: "football",
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["football", "ball", "training", "budget"],
    images: [
      { url: "https://images.unsplash.com/photo-1548204560-3d8af91d3dc4?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "Size 5", color: "Multi", price: 1200, originalPrice: 1500, stock: 30 },
      { size: "Size 4", color: "Multi", price: 1000, originalPrice: 1200, stock: 25 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Rubber" },
      { attributeName: "Feature", attributeValue: "Machine-stitched" },
    ],
  },
  {
    name: "Sports Duffel Bag",
    slug: "sports-duffel-bag",
    description: "Spacious sports duffel bag with separate shoe compartment. Perfect for training and travel.",
    categorySlug: "accessories",
    brandSlug: "nike",
    sportSlug: null,
    gender: "Unisex",
    isFeatured: false,
    allowCustomization: false,
    tags: ["bag", "accessories", "training"],
    images: [
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", isThumbnail: true },
    ],
    variants: [
      { size: null, color: "Black", price: 3500, originalPrice: 4000, stock: 15 },
      { size: null, color: "Navy", price: 3500, originalPrice: 4000, stock: 10 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Polyester" },
      { attributeName: "Feature", attributeValue: "Shoe compartment" },
      { attributeName: "Capacity", attributeValue: "65L" },
    ],
  },
  {
    name: "Adidas Training Tracksuit",
    slug: "adidas-training-tracksuit",
    description: "Comfortable training tracksuit with zippered pockets. Ideal for warm-up and cool-down sessions.",
    categorySlug: "sportswear",
    brandSlug: "adidas",
    sportSlug: null,
    gender: "Men",
    isFeatured: false,
    allowCustomization: false,
    tags: ["tracksuit", "training", "sportswear"],
    images: [
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", isThumbnail: true },
    ],
    variants: [
      { size: "S", color: "Black", price: 5500, originalPrice: 6500, stock: 5 },
      { size: "M", color: "Black", price: 5500, originalPrice: 6500, stock: 8 },
      { size: "L", color: "Black", price: 5500, originalPrice: 6500, stock: 6 },
      { size: "XL", color: "Black", price: 5500, originalPrice: 6500, stock: 4 },
      { size: "M", color: "Navy", price: 5500, originalPrice: 6500, stock: 5 },
      { size: "L", color: "Navy", price: 5500, originalPrice: 6500, stock: 4 },
    ],
    attributes: [
      { attributeName: "Material", attributeValue: "Recycled polyester" },
      { attributeName: "Feature", attributeValue: "Zippered pockets" },
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
      defaults: { name: cat.name, slug: cat.slug, needsSize: cat.needsSize, sizeType: cat.sizeType as any },
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
