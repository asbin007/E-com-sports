import "reflect-metadata";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../../config/config.js";

import User from "../models/userModel.js";
import Address from "../models/addressModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import ProductType from "../models/productTypeModel.js";
import Product from "../models/productModel.js";
import ProductImage from "../models/productImageModel.js";
import Variant from "../models/variantModel.js";
import Inventory from "../models/inventoryModel.js";
import CartItem from "../models/cartItemModel.js";
import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Payment from "../models/paymentModel.js";
import Collection from "../models/collectionModel.js";
import CollectionProduct from "../models/collectionProductModel.js";
import Wishlist from "../models/wishlistModel.js";
import ProductReview from "../models/productReviewModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Sport from "../models/sportModel.js";
import ProductAttribute from "../models/productAttributeModel.js";
import StatusHistory from "../models/statusHistoryModel.js";

const sequelize = new Sequelize(( envConfig.databaseUrl as string), {
  models: [
    User,
    Address,
    Category,
    Brand,
    ProductType,
    Product,
    ProductImage,
    Variant,
    Inventory,
    CartItem,
    Order,
    OrderItem,
    Payment,
    Collection,
    CollectionProduct,
    Wishlist,
    ProductReview,
    Chat,
    Message,
    Sport,
    ProductAttribute,
    StatusHistory,
  ],
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

// ===== DATABASE RELATIONSHIPS =====

// User x Address
Address.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Address, { foreignKey: "userId", onDelete: "CASCADE" });

// User x CartItem
CartItem.belongsTo(User, { foreignKey: "userId" });
User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });

// User x Order
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });

// Category x Product
Product.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Product, { foreignKey: "categoryId" });

// Category Self-Referencing (Hierarchy) - handled by @BelongsTo decorator in categoryModel.ts
// Do NOT add manual belongsTo/hasMany here with the same alias or Sequelize will throw a duplicate alias error.

// Brand x Product
Product.belongsTo(Brand, { foreignKey: "brandId" });
Brand.hasMany(Product, { foreignKey: "brandId" });

// Sport x Product
Product.belongsTo(Sport, { foreignKey: "sportId" });
Sport.hasMany(Product, { foreignKey: "sportId" });

// ProductType x Product
Product.belongsTo(ProductType, { foreignKey: "productTypeId" });
ProductType.hasMany(Product, { foreignKey: "productTypeId" });

// ProductType x Category
ProductType.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(ProductType, { foreignKey: "categoryId" });

// Product x ProductImage
ProductImage.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(ProductImage, { foreignKey: "productId", onDelete: "CASCADE" });

// Product x Variant
Variant.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Variant, { foreignKey: "productId", onDelete: "CASCADE" });

// Product x ProductAttribute
ProductAttribute.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(ProductAttribute, { foreignKey: "productId", onDelete: "CASCADE" });

// Variant x Inventory
Inventory.belongsTo(Variant, { foreignKey: "variantId" });
Variant.hasOne(Inventory, { foreignKey: "variantId", onDelete: "CASCADE" });

// Product x CartItem (new: productId + size instead of variantId)
CartItem.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(CartItem, { foreignKey: "productId" });

// Product x OrderItem (new: productId instead of variantId)
OrderItem.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(OrderItem, { foreignKey: "productId", onDelete: "CASCADE" });

// Order x OrderItem
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });

// Payment x Order
Order.belongsTo(Payment, { foreignKey: "paymentId" });
Payment.hasOne(Order, { foreignKey: "paymentId" });

// ===== NEW RELATIONSHIPS =====

// Collection x CollectionProduct x Product (Many-to-Many)
Collection.belongsToMany(Product, { through: CollectionProduct, foreignKey: "collectionId" });
Product.belongsToMany(Collection, { through: CollectionProduct, foreignKey: "productId" });
CollectionProduct.belongsTo(Collection, { foreignKey: "collectionId" });
CollectionProduct.belongsTo(Product, { foreignKey: "productId" });
Collection.hasMany(CollectionProduct, { foreignKey: "collectionId", onDelete: "CASCADE" });
Product.hasMany(CollectionProduct, { foreignKey: "productId", onDelete: "CASCADE" });

// User x Wishlist x Product
Wishlist.belongsTo(User, { foreignKey: "userId" });
Wishlist.belongsTo(Product, { foreignKey: "productId" });
User.hasMany(Wishlist, { foreignKey: "userId", onDelete: "CASCADE" });
Product.hasMany(Wishlist, { foreignKey: "productId", onDelete: "CASCADE" });

// User x ProductReview x Product
ProductReview.belongsTo(User, { foreignKey: "userId" });
ProductReview.belongsTo(Product, { foreignKey: "productId" });
User.hasMany(ProductReview, { foreignKey: "userId", onDelete: "CASCADE" });
Product.hasMany(ProductReview, { foreignKey: "productId", onDelete: "CASCADE" });

// Chat relationships
Chat.belongsTo(User, { foreignKey: "customerId", as: "Customer" });
Chat.belongsTo(User, { foreignKey: "adminId", as: "Admin" });
User.hasMany(Chat, { foreignKey: "customerId", as: "CustomerChats" });
User.hasMany(Chat, { foreignKey: "adminId", as: "AdminChats" });

// Message relationships
Message.belongsTo(Chat, { foreignKey: "chatId" });
Message.belongsTo(User, { foreignKey: "senderId", as: "Sender" });
Chat.hasMany(Message, { foreignKey: "chatId", onDelete: "CASCADE" });
User.hasMany(Message, { foreignKey: "senderId", as: "SentMessages" });

// StatusHistory relationships
StatusHistory.belongsTo(Order, { foreignKey: "orderId" });
Order.hasMany(StatusHistory, { foreignKey: "orderId", onDelete: "CASCADE" });

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    const qi = sequelize.getQueryInterface();

    // ── Schema migration: update order_items to use productId instead of variantId ──
    try {
      // 1. Add product_id column if it doesn't exist
      const orderItemsDesc = await qi.describeTable("order_items");
      if (!orderItemsDesc["product_id"]) {
        await sequelize.query(
          `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL`
        );
        console.log("✅ order_items: added product_id column");
      }

      // 2. Drop NOT NULL constraint on variant_id if it still applies
      if (orderItemsDesc["variant_id"]) {
        await sequelize.query(
          `ALTER TABLE order_items ALTER COLUMN variant_id DROP NOT NULL`
        ).catch(() => { /* already nullable, ignore */ });
        console.log("✅ order_items: variant_id made nullable");
      }

      // 3. Make sku nullable if not already
      if (orderItemsDesc["sku"]) {
        await sequelize.query(
          `ALTER TABLE order_items ALTER COLUMN sku DROP NOT NULL`
        ).catch(() => { /* already nullable, ignore */ });
      }
    } catch (migrationError) {
      console.warn("⚠️  order_items migration skipped:", (migrationError as Error).message);
    }
    // ─────────────────────────────────────────────────────────────────────────────

      // ── Schema migration: drop variants.sku ──
      try {
        const variantsDesc = await qi.describeTable("variants");
        if (variantsDesc["sku"]) {
          try {
            await sequelize.query(
              `ALTER TABLE variants DROP COLUMN IF EXISTS "sku"`
            );
            console.log("✅ variants: sku column dropped");
          } catch {
            // If dropping fails (e.g. constraint/index), at least make it nullable
            // so inserts/creates without sku don't break.
            await sequelize.query(
              `ALTER TABLE variants ALTER COLUMN sku DROP NOT NULL`
            ).catch(() => {
              /* ignore to avoid blocking dev */
            });
          }
        }
      } catch (migrationError) {
        console.warn(
          "⚠️ variants sku drop skipped:",
          (migrationError as Error).message
        );
      }

      // ── Schema migration: ensure category columns exist ──
      try {
        const categoriesDesc = await qi.describeTable("categories");

        if (!categoriesDesc["name"]) {
          await sequelize.query(
            `ALTER TABLE categories ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT ''`
          );
        }
        if (!categoriesDesc["slug"]) {
          await sequelize.query(
            `ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NOT NULL DEFAULT ''`
          );
        }
        if (!categoriesDesc["needsSize"]) {
          await sequelize.query(
            `ALTER TABLE categories ADD COLUMN IF NOT EXISTS "needsSize" BOOLEAN NOT NULL DEFAULT true`
          );
        }
        if (!categoriesDesc["sizeType"]) {
          await sequelize.query(
            `ALTER TABLE categories ADD COLUMN IF NOT EXISTS "sizeType" VARCHAR(50) NULL DEFAULT NULL`
          );
        }
        if (!categoriesDesc["isActive"]) {
          await sequelize.query(
            `ALTER TABLE categories ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`
          );
        }
      } catch (migrationError) {
        console.warn(
          "⚠️ categories schema migration skipped:",
          (migrationError as Error).message
        );
      }

      // ── Schema migration: ensure user role supports 'delivery' ──
      try {
        await sequelize.query(
          `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'delivery'`
        ).catch(() => {});
      } catch (migrationError) {
        try {
          await sequelize.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR(50) USING "role"::VARCHAR(50)`
          );
          await sequelize.query(
            `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer'`
          );
          console.log("✅ users.role converted to VARCHAR");
        } catch {
          console.warn("⚠️ users.role migration skipped");
        }
      }

      // ── Schema migration: add account lockout columns to users ──
      try {
        const usersDesc = await qi.describeTable("users");
        if (!usersDesc["failed_login_attempts"]) {
          await sequelize.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0`
          );
          console.log("✅ users: failed_login_attempts column added");
        }
        if (!usersDesc["locked_until"]) {
          await sequelize.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP WITH TIME ZONE NULL`
          );
          console.log("✅ users: locked_until column added");
        }
      } catch (migrationError) {
        console.warn("⚠️ users lockout columns migration skipped:", (migrationError as Error).message);
      }

      // ── Schema migration: add deliveryBoyId to orders ──
      try {
        const ordersDesc = await qi.describeTable("orders");
        if (!ordersDesc["deliveryBoyId"]) {
          await sequelize.query(
            `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryBoyId" UUID NULL REFERENCES "users"("id") ON DELETE SET NULL`
          );
          console.log("✅ orders: deliveryBoyId column added");
        }
      } catch (migrationError) {
        console.warn("⚠️ orders.deliveryBoyId migration skipped:", (migrationError as Error).message);
      }

      // ── Schema migration: ensure order columns exist ──
      try {
        const ordersDesc2 = await qi.describeTable("orders");
        const orderColumns: Record<string, string> = {
          orderNumber: `"orderNumber" VARCHAR(255) UNIQUE`,
          subtotal: `"subtotal" FLOAT`,
          deliveryCharge: `"deliveryCharge" FLOAT DEFAULT 0`,
          customerNote: `"customerNote" TEXT`,
          whatsappConfirmed: `"whatsappConfirmed" BOOLEAN DEFAULT FALSE`,
          paymentMethod: `"paymentMethod" VARCHAR(255)`,
          paymentPid: `"paymentPid" VARCHAR(255)`,
          paymentScreenshot: `"paymentScreenshot" VARCHAR(500)`,
        };
        for (const [col, definition] of Object.entries(orderColumns)) {
          if (!ordersDesc2[col]) {
            await sequelize.query(
              `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS ${definition}`
            );
            console.log(`✅ orders: ${col} column added`);
          }
        }
        // paymentStatus — add as VARCHAR to avoid ENUM migration issues
        if (!ordersDesc2["paymentStatus"]) {
          await sequelize.query(
            `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(20) DEFAULT 'pending'`
          );
          console.log("✅ orders: paymentStatus column added");
        }
      } catch (migrationError) {
        console.warn("⚠️ orders columns migration skipped:", (migrationError as Error).message);
      }

      // ── Schema migration: add payment_rejection_reason to orders ──
      try {
        const ordersDesc3 = await qi.describeTable("orders");
        if (!ordersDesc3["payment_rejection_reason"]) {
          await sequelize.query(
            `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_rejection_reason" TEXT NULL`
          );
          console.log("✅ orders: payment_rejection_reason column added");
        }
      } catch (migrationError) {
        console.warn("⚠️ orders.payment_rejection_reason migration skipped:", (migrationError as Error).message);
      }

      // ── Fix: delete broken ProductType with null categoryId ──
      try {
        await sequelize.query(`DELETE FROM "product_types" WHERE "categoryId" IS NULL`);
      } catch { /* ignore */ }

      // ── Schema migration: add allowCustomization and tags to products ──
      try {
        const productsDesc = await qi.describeTable("products");
        if (!productsDesc["allowCustomization"]) {
          await sequelize.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allowCustomization" BOOLEAN NOT NULL DEFAULT FALSE`
          );
          console.log("✅ products: allowCustomization column added");
        }
        if (!productsDesc["tags"]) {
          await sequelize.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT '{}'`
          );
          console.log("✅ products: tags column added");
        }
      } catch (migrationError) {
        console.warn("⚠️ products schema migration skipped:", (migrationError as Error).message);
      }

      // ── Add performance indexes ──
      try {
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items("userId");
          CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items("productId");
          CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items("orderId");
          CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items("productId");
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId");
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders("orderStatus");
          CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders("createdAt");
          CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images("productId");
          CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants("productId");
          CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews("productId");
          CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews("userId");
          CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist("userId");
          CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist("productId");
          CREATE INDEX IF NOT EXISTS idx_payments_status ON payments("paymentStatus");
        `);
        console.log("✅ Performance indexes created");
      } catch (indexError) {
        console.warn("⚠️ Index creation skipped:", (indexError as Error).message);
      }

  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

export default sequelize;

