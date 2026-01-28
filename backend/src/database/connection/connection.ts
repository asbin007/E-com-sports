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

// Brand x Product
Product.belongsTo(Brand, { foreignKey: "brandId" });
Brand.hasMany(Product, { foreignKey: "brandId" });

// ProductType x Product
Product.belongsTo(ProductType, { foreignKey: "productTypeId" });
ProductType.hasMany(Product, { foreignKey: "productTypeId" });

// Product x ProductImage
ProductImage.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(ProductImage, { foreignKey: "productId", onDelete: "CASCADE" });

// Product x Variant
Variant.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Variant, { foreignKey: "productId", onDelete: "CASCADE" });

// Variant x Inventory
Inventory.belongsTo(Variant, { foreignKey: "variantId" });
Variant.hasOne(Inventory, { foreignKey: "variantId", onDelete: "CASCADE" });

// Variant x CartItem
CartItem.belongsTo(Variant, { foreignKey: "variantId" });
Variant.hasMany(CartItem, { foreignKey: "variantId" });

// Variant x OrderItem
OrderItem.belongsTo(Variant, { foreignKey: "variantId" });
Variant.hasMany(OrderItem, { foreignKey: "variantId" });

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

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

export default sequelize;

