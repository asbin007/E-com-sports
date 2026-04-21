import sequelize from "./database/connection/connection.js";
import Category from "./database/models/categoryModel.js";
import Brand from "./database/models/brandModel.js";
import { slugify } from "./utils/slugify.js";
import ProductType from "./database/models/productTypeModel.js";
import Product from "./database/models/productModel.js";
import Variant from "./database/models/variantModel.js";
import Inventory from "./database/models/inventoryModel.js";
import ProductImage from "./database/models/productImageModel.js";

const categories = ["Football", "Cricket", "Basketball", "Gym & Fitness", "Outdoor", "Running", "Badminton", "Tennis"];
const brands = ["Nike", "Adidas", "Puma", "New Balance", "Under Armour"];
const productTypes = ["Shoes", "Jersey", "Accessories", "Shorts", "Socks", "Bags"];

const products = [
  {
    name: "Nike Air Zoom Pegasus 39",
    description: "The Nike Air Zoom Pegasus 39 is made for runners of all levels and goals. Whether you're hitting the pavement for your daily miles or training for a race, this shoe provides a responsive ride and a comfortable fit.",
    sportType: "Running",
    productType: "Shoes",
    price: 18000,
    images: ["https://placehold.co/800x800?text=Nike+Air+Zoom+Pegasus"]
  },
  {
    name: "Adidas Predator Elite FG",
    description: "Built for dominance on firm ground, the Adidas Predator Elite FG features high-definition grip technology and a lightweight design for ultimate control and power on the pitch.",
    sportType: "Football",
    productType: "Shoes",
    price: 32000,
    images: ["https://placehold.co/800x800/orange/white?text=Adidas+Predator"]
  },
  {
    name: "Puma Future Ultimate FG/AG",
    description: "Inspired by Neymar Jr., the PUMA FUTURE Ultimate offers a revolutionary fit and superior agility, allowing you to move freely and dominate the game at every turn.",
    sportType: "Football",
    productType: "Shoes",
    price: 28000,
    images: ["https://placehold.co/800x800/blue/white?text=Puma+Future"]
  },
  {
    name: "New Balance FuelCell Rebel v4",
    description: "The New Balance FuelCell Rebel v4 is a high-energy return running shoe designed for faster paces. Its lightweight construction and plush cushioning make it an ideal choice for tempo runs and race days.",
    sportType: "Running",
    productType: "Shoes",
    price: 21000,
    images: ["https://placehold.co/800x800/green/white?text=NB+FuelCell"]
  },
  {
    name: "Under Armour Curry 11",
    description: "The Curry 11 'Future' celebrates Step's legacy of changing the game. With UA Flow cushioning and a supportive upper, it provides unparalleled comfort and performance on the court.",
    sportType: "Basketball",
    productType: "Shoes",
    price: 25000,
    images: ["https://placehold.co/800x800/yellow/black?text=UA+Curry+11"]
  },
  {
    name: "Cricket Spike 2.0 Pro",
    description: "Professional grade cricket shoes with superior grip and stability for all-day performance in the field and at the crease.",
    sportType: "Cricket",
    productType: "Shoes",
    price: 12000,
    images: ["https://placehold.co/800x800/white/black?text=Cricket+Spike"]
  }
];

const seed = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false });
        console.log("Database connected and synced.");

        // Create Categories (Sport Types)
        const categoryMap: { [key: string]: string } = {};
        for (const catName of categories) {
            const [cat] = await Category.findOrCreate({ 
                where: { name: catName }, 
                defaults: { name: catName } 
            });
            categoryMap[catName] = cat.id;
        }
        console.log("Categories seeded");

        // Create Brands
        const brandMap: { [key: string]: string } = {};
        for (const brandName of brands) {
            const slug = slugify(brandName);
            const [brand] = await Brand.findOrCreate({
                where: { slug },
                defaults: { name: brandName, slug },
            });
            brandMap[brandName] = brand.id;
        }
        console.log("Brands seeded");

        // Create Product Types
        const productTypeMap: { [key: string]: string } = {};
        for (const typeName of productTypes) {
            const [type] = await ProductType.findOrCreate({ 
                where: { name: typeName }, 
                defaults: { name: typeName, description: `${typeName} for various sports` } 
            });
            productTypeMap[typeName] = type.id;
        }
        console.log("Product types seeded");

        // Create Products
        for (const p of products) {
            const randomBrand = brands[Math.floor(Math.random() * brands.length)];
            if (!randomBrand) continue;
            const brandId = brandMap[randomBrand];
            
            // Map sportType to Category
            let categoryId = categoryMap[p.sportType] || categoryMap["Running"];
            let productTypeId = productTypeMap[p.productType] || productTypeMap["Shoes"];

            let product = await Product.findOne({ where: { name: p.name } });
            if (!product) {
                product = await Product.create({
                    name: p.name,
                    description: p.description,
                    categoryId,
                    brandId,
                    productTypeId,
                    isActive: true
                });
                console.log(`Created product: ${p.name}`);

                if (p.images && p.images.length > 0) {
                     await ProductImage.create({
                         productId: product.id,
                         url: p.images[0],
                         isPrimary: true,
                         order: 0
                     });
                }

                const sizes = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];
                const colors = ["Black", "Neon", "White", "Multi"];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];

                for (const size of sizes) {
                    const variant = await Variant.create({
                        productId: product.id,
                        size,
                        color: randomColor || "Black",
                        price: p.price,
                        salePrice: p.price > 25000 ? p.price - 3000 : null
                    });

                    await Inventory.create({
                        variantId: variant.id,
                        stock: 15,
                        reservedStock: 0
                    });
                }
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
