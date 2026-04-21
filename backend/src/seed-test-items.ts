import sequelize from "./database/connection/connection.js";
import Category from "./database/models/categoryModel.js";
import Brand from "./database/models/brandModel.js";
import ProductType from "./database/models/productTypeModel.js";
import Product from "./database/models/productModel.js";
import Variant from "./database/models/variantModel.js";
import Inventory from "./database/models/inventoryModel.js";
import ProductImage from "./database/models/productImageModel.js";
import { slugify } from "./utils/slugify.js";

const testProducts = [
  // --- FOOTBALL ---
  {
    name: "Elite Vapor FG Boots",
    sport: "Football",
    productType: "Shoes",
    brand: "Nike",
    description: "Pro-level firm ground football boots. Engineered for explosive speed and precision control on natural grass.",
    categoryMeta: { needsSize: true, sizeType: "shoe" },
    variants: [
      { size: "UK 7", color: "Volt Green", price: 18500, stock: 15 },
      { size: "UK 8", color: "Volt Green", price: 18500, stock: 20 },
      { size: "UK 9", color: "Hyper Pink", price: 19000, stock: 12 },
      { size: "UK 10", color: "Hyper Pink", price: 19000, stock: 8 }
    ],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Champions League Match Ball",
    sport: "Football",
    productType: "Accessories",
    brand: "Adidas",
    description: "The official match ball used in Europe's elite competition. FIFA Quality Pro certified for perfect flight and durability.",
    categoryMeta: { needsSize: false, sizeType: null },
    variants: [
      { size: "One Size", color: "Star White", price: 4200, stock: 50 }
    ],
    image: "https://images.unsplash.com/photo-1614632537197-38a17461c2ba?auto=format&fit=crop&q=80&w=800"
  },
  // --- CRICKET ---
  {
    name: "Alpha Pro English Willow",
    sport: "Cricket",
    productType: "Accessories",
    brand: "Adidas",
    description: "Hand-crafted Grade 1 English Willow. Balanced for power hitting and effortless stroke play.",
    categoryMeta: { needsSize: true, sizeType: null },
    variants: [
      { size: "Short Handle", color: "Natural", price: 32000, stock: 5 },
      { size: "Harrow", color: "Natural", price: 28000, stock: 3 }
    ],
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800"
  },
  // --- BASKETBALL ---
  {
    name: "Air Jordan XXXVIII",
    sport: "Basketball",
    productType: "Shoes",
    brand: "Nike",
    description: "The next evolution of flight. High-responsive cushioning for vertical dominance and lateral stability.",
    categoryMeta: { needsSize: true, sizeType: "shoe" },
    variants: [
      { size: "US 9", color: "Bred", price: 22000, stock: 10 },
      { size: "US 10", color: "Bred", price: 22000, stock: 15 },
      { size: "US 11", color: "Space Gray", price: 23500, stock: 8 }
    ],
    image: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&q=80&w=800"
  },
  // --- GYM & FITNESS ---
  {
    name: "Hex Pro Rubber Dumbbells",
    sport: "Gym & Fitness",
    productType: "Accessories",
    brand: "Nike",
    description: "Premium rubber-coated hex dumbbells. Non-slip grip and floor-safe design for intense home workouts.",
    categoryMeta: { needsSize: true, sizeType: null },
    variants: [
      { size: "15kg Set", color: "Midnight Black", price: 14000, stock: 20 },
      { size: "25kg Set", color: "Midnight Black", price: 24000, stock: 10 }
    ],
    image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "TechFit Compression Jersey",
    sport: "Gym & Fitness",
    productType: "Jersey",
    brand: "Puma",
    description: "Ultra-breathable compression wear. Keeps you dry and supported during peak intensity.",
    categoryMeta: { needsSize: true, sizeType: "clothing" },
    variants: [
      { size: "S", color: "Carbon Gray", price: 3800, stock: 40 },
      { size: "M", color: "Carbon Gray", price: 3800, stock: 60 },
      { size: "L", color: "Stealth Black", price: 3800, stock: 50 }
    ],
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800"
  }
];

const seedTestItems = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected.");

    for (const p of testProducts) {
      // 1. Category
      const [category] = await Category.findOrCreate({
        where: { slug: slugify(p.sport) },
        defaults: {
          name: p.sport,
          slug: slugify(p.sport),
          needsSize: p.categoryMeta.needsSize,
          sizeType: p.categoryMeta.sizeType as any
        }
      });

      // 2. Brand
      const [brand] = await Brand.findOrCreate({
        where: { slug: slugify(p.brand) },
        defaults: {
          name: p.brand,
          slug: slugify(p.brand)
        }
      });

      // 3. Product Type
      const [productType] = await ProductType.findOrCreate({
        where: { slug: slugify(p.productType) },
        defaults: {
          name: p.productType,
          slug: slugify(p.productType),
          categoryId: category.id
        }
      });

      // 4. Product
      const [product] = await Product.findOrCreate({
        where: { slug: slugify(p.name) },
        defaults: {
          name: p.name,
          slug: slugify(p.name),
          description: p.description,
          categoryId: category.id,
          brandId: brand.id,
          productTypeId: productType.id,
          isActive: true
        }
      });

      // 5. Image
      await ProductImage.findOrCreate({
        where: { productId: product.id },
        defaults: {
          productId: product.id,
          url: p.image,
          isPrimary: true
        }
      });

      // 6. Variants & Inventory
      for (const v of p.variants) {
        const [variant] = await Variant.findOrCreate({
          where: { productId: product.id, size: v.size, color: v.color },
          defaults: {
            productId: product.id,
            size: v.size,
            color: v.color,
            price: v.price,
            stock: v.stock,
            isActive: true
          }
        });

        await Inventory.findOrCreate({
          where: { variantId: variant.id },
          defaults: {
            variantId: variant.id,
            stock: v.stock
          }
        });
      }
      console.log(`Seeded: ${p.name}`);
    }

    console.log("Seeding test items complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding test items failed:", error);
    process.exit(1);
  }
};

seedTestItems();
