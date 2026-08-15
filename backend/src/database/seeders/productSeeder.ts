import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";
import ProductImage from "../models/productImageModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import ProductType from "../models/productTypeModel.js";

interface SeedProduct {
  name: string;
  description: string;
  categorySlug: string;
  brandSlug: string;
  productTypeSlug: string;
  gender: string;
  images: string[];
  variants: { size: string; color: string; price: number; originalPrice?: number; stock: number }[];
}

const productsData: SeedProduct[] = [
  // Football
  {
    name: "Nike Mercurial Vapor 15",
    description: "Lightweight football boots designed for speed on firm ground. Features a textured upper for precise ball control and a responsive sole plate.",
    categorySlug: "football",
    brandSlug: "nike",
    productTypeSlug: "shoes",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800"],
    variants: [
      { size: "UK 7", color: "Black", price: 8500, originalPrice: 9500, stock: 10 },
      { size: "UK 8", color: "Black", price: 8500, originalPrice: 9500, stock: 8 },
      { size: "UK 9", color: "Black", price: 8500, originalPrice: 9500, stock: 12 },
      { size: "UK 10", color: "Black", price: 8500, originalPrice: 9500, stock: 6 },
      { size: "UK 8", color: "White", price: 8500, originalPrice: 9500, stock: 5 },
      { size: "UK 9", color: "White", price: 8500, originalPrice: 9500, stock: 7 },
    ],
  },
  {
    name: "Adidas Predator Edge Jersey",
    description: "Official match-day football jersey with moisture-wicking AEROREADY technology. Slim fit design for maximum comfort during play.",
    categorySlug: "football",
    brandSlug: "adidas",
    productTypeSlug: "jersey",
    gender: "Men",
    images: ["https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=800"],
    variants: [
      { size: "S", color: "Red", price: 3200, stock: 15 },
      { size: "M", color: "Red", price: 3200, stock: 20 },
      { size: "L", color: "Red", price: 3200, stock: 18 },
      { size: "XL", color: "Red", price: 3200, stock: 10 },
      { size: "M", color: "Blue", price: 3200, stock: 12 },
      { size: "L", color: "Blue", price: 3200, stock: 14 },
    ],
  },
  {
    name: "Adidas Football - FIFA Quality Pro",
    description: "Official match ball with thermal-bonded seamless surface. FIFA Quality Pro certified for professional play.",
    categorySlug: "football",
    brandSlug: "adidas",
    productTypeSlug: "equipment",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800"],
    variants: [
      { size: "Size 5", color: "White/Black", price: 4500, originalPrice: 5200, stock: 25 },
      { size: "Size 4", color: "White/Black", price: 3800, stock: 15 },
    ],
  },
  // Cricket
  {
    name: "Kookaburra Kahuna Pro Bat",
    description: "Premium English willow cricket bat with thick edges and a mid-to-low sweet spot. Ideal for aggressive stroke play.",
    categorySlug: "cricket",
    brandSlug: "kookaburra",
    productTypeSlug: "equipment",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800"],
    variants: [
      { size: "Short Handle", color: "Natural", price: 12000, originalPrice: 14000, stock: 8 },
      { size: "Long Handle", color: "Natural", price: 12500, stock: 5 },
    ],
  },
  {
    name: "Nike Cricket Batting Gloves",
    description: "Lightweight batting gloves with premium leather palm and high-density foam protection. Flexible finger design for superior grip.",
    categorySlug: "cricket",
    brandSlug: "nike",
    productTypeSlug: "gloves",
    gender: "Men",
    images: ["https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800"],
    variants: [
      { size: "M", color: "White", price: 2800, stock: 12 },
      { size: "L", color: "White", price: 2800, stock: 10 },
      { size: "XL", color: "White", price: 2800, stock: 8 },
    ],
  },
  // Basketball
  {
    name: "Nike Air Jordan XXXVIII",
    description: "Premium basketball shoes with Zoom Air cushioning and a lightweight woven upper. Designed for explosive play on the court.",
    categorySlug: "basketball",
    brandSlug: "nike",
    productTypeSlug: "shoes",
    gender: "Men",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
    variants: [
      { size: "UK 8", color: "Black/Red", price: 15000, originalPrice: 18000, stock: 6 },
      { size: "UK 9", color: "Black/Red", price: 15000, originalPrice: 18000, stock: 8 },
      { size: "UK 10", color: "Black/Red", price: 15000, originalPrice: 18000, stock: 5 },
      { size: "UK 11", color: "Black/Red", price: 15000, originalPrice: 18000, stock: 4 },
      { size: "UK 9", color: "White/Blue", price: 15000, originalPrice: 18000, stock: 7 },
    ],
  },
  {
    name: "Adidas Basketball Shorts Pro",
    description: "Lightweight basketball shorts with side pockets and elastic waistband. Breathable mesh panels for ventilation during intense games.",
    categorySlug: "basketball",
    brandSlug: "adidas",
    productTypeSlug: "shorts",
    gender: "Men",
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800"],
    variants: [
      { size: "M", color: "Black", price: 2200, stock: 20 },
      { size: "L", color: "Black", price: 2200, stock: 18 },
      { size: "XL", color: "Black", price: 2200, stock: 12 },
      { size: "M", color: "Navy", price: 2200, stock: 15 },
      { size: "L", color: "Navy", price: 2200, stock: 14 },
    ],
  },
  // Running
  {
    name: "Asics Gel-Nimbus 26",
    description: "Premium cushioned running shoes with PureGEL technology and FF BLAST PLUS cushioning. Perfect for long-distance runners seeking comfort.",
    categorySlug: "running",
    brandSlug: "asics",
    productTypeSlug: "shoes",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"],
    variants: [
      { size: "UK 7", color: "Blue/White", price: 11000, originalPrice: 13000, stock: 10 },
      { size: "UK 8", color: "Blue/White", price: 11000, originalPrice: 13000, stock: 12 },
      { size: "UK 9", color: "Blue/White", price: 11000, originalPrice: 13000, stock: 8 },
      { size: "UK 10", color: "Blue/White", price: 11000, originalPrice: 13000, stock: 6 },
      { size: "UK 8", color: "Black/Orange", price: 11000, originalPrice: 13000, stock: 9 },
    ],
  },
  // Gym & Fitness
  {
    name: "Under Armour Training Tracksuit",
    description: "Full zip tracksuit with moisture-wicking fabric and 4-way stretch. Ideal for warm-ups, gym sessions, and casual wear.",
    categorySlug: "gym-fitness",
    brandSlug: "under-armour",
    productTypeSlug: "tracksuit",
    gender: "Men",
    images: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"],
    variants: [
      { size: "M", color: "Black", price: 5500, originalPrice: 6500, stock: 10 },
      { size: "L", color: "Black", price: 5500, originalPrice: 6500, stock: 12 },
      { size: "XL", color: "Black", price: 5500, originalPrice: 6500, stock: 8 },
      { size: "L", color: "Grey", price: 5500, originalPrice: 6500, stock: 6 },
    ],
  },
  {
    name: "Nike Gym Gloves Pro",
    description: "Padded weight training gloves with breathable mesh back and adjustable wrist strap. Durable leather palm for superior grip.",
    categorySlug: "gym-fitness",
    brandSlug: "nike",
    productTypeSlug: "gloves",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800"],
    variants: [
      { size: "S", color: "Black", price: 1800, stock: 20 },
      { size: "M", color: "Black", price: 1800, stock: 25 },
      { size: "L", color: "Black", price: 1800, stock: 18 },
    ],
  },
  // Outdoor
  {
    name: "Adidas Terrex Hiking Shoes",
    description: "Waterproof hiking shoes with Continental rubber outsole for superior grip on wet and dry surfaces. GORE-TEX lining keeps feet dry.",
    categorySlug: "outdoor",
    brandSlug: "adidas",
    productTypeSlug: "shoes",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=800"],
    variants: [
      { size: "UK 7", color: "Green/Black", price: 9500, originalPrice: 11000, stock: 8 },
      { size: "UK 8", color: "Green/Black", price: 9500, originalPrice: 11000, stock: 10 },
      { size: "UK 9", color: "Green/Black", price: 9500, originalPrice: 11000, stock: 7 },
      { size: "UK 10", color: "Green/Black", price: 9500, originalPrice: 11000, stock: 5 },
    ],
  },
  // Accessories
  {
    name: "Nike Sports Duffle Bag",
    description: "Spacious training duffle bag with separate shoe compartment and adjustable shoulder strap. Water-resistant base for all-weather use.",
    categorySlug: "accessories",
    brandSlug: "nike",
    productTypeSlug: "bags",
    gender: "Unisex",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
    variants: [
      { size: "One Size", color: "Black", price: 3500, originalPrice: 4200, stock: 15 },
      { size: "One Size", color: "Navy", price: 3500, originalPrice: 4200, stock: 10 },
    ],
  },
];

export async function seedProducts(): Promise<void> {
  const existingProducts = await Product.count();
  if (existingProducts > 0) {
    console.log("Products already seeded, skipping...");
    return;
  }

  const categories = await Category.findAll();
  const brands = await Brand.findAll();
  const productTypes = await ProductType.findAll();

  if (categories.length === 0 || brands.length === 0 || productTypes.length === 0) {
    console.log("⚠️ Cannot seed products: categories, brands, or product types not found");
    return;
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  const brandMap = new Map(brands.map((b) => [b.slug, b.id]));
  const productTypeMap = new Map(productTypes.map((pt) => [(pt as any).slug, pt.id]));

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categorySlug);
    const brandId = brandMap.get(p.brandSlug);
    const productTypeId = productTypeMap.get(p.productTypeSlug);

    if (!categoryId || !brandId || !productTypeId) {
      console.log(`⚠️ Skipping "${p.name}": missing category/brand/productType`);
      continue;
    }

    const product = await Product.create({
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: p.description,
      categoryId,
      brandId,
      productTypeId,
      gender: p.gender,
      isActive: true,
      price: p.variants[0]?.price || 0,
    });

    // Create variants
    for (const v of p.variants) {
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

    // Create images
    for (let i = 0; i < p.images.length; i++) {
      await ProductImage.create({
        productId: product.id,
        url: p.images[i],
        altText: p.name,
        isThumbnail: i === 0,
        sortOrder: i,
      });
    }

    console.log(`✅ Seeded: ${p.name}`);
  }

  console.log(`✅ Product seeding complete (${productsData.length} products)`);
}
