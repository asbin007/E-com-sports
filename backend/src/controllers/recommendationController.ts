import type { Request, Response } from "express";
import { Op, Sequelize, literal } from "sequelize";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Brand from "../database/models/brandModel.js";
import Category from "../database/models/categoryModel.js";
import Variant from "../database/models/variantModel.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import CartItem from "../database/models/cartItemModel.js";
import sequelize from "../database/connection/connection.js";

class RecommendationController {
  // Get trending products based on order frequency
  async getTrendingProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;

      // Get products ordered most in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Orders reference products directly (variantId is legacy after the
      // productId+size migration), so aggregate on OrderItem.productId.
      const trendingProductIds = await OrderItem.findAll({
        attributes: [
          "productId",
          [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQty"],
        ],
        include: [
          {
            model: Order,
            attributes: [],
            where: {
              createdAt: { [Op.gte]: thirtyDaysAgo },
            },
            required: true,
          },
        ],
        where: { productId: { [Op.ne]: null } },
        group: ["OrderItem.productId"],
        order: [[Sequelize.literal('"totalQty"'), "DESC"]],
        limit: Number(limit),
        raw: true,
      });

      const productIds = [...new Set(trendingProductIds.map((item: any) => item.productId))];

      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds }, isActive: true },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Category, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "price", "originalPrice", "size", "color"], limit: 1 },
        ],
      });

      res.status(200).json({
        message: "Trending products fetched successfully",
        data: products,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get new arrival products (created in last 30 days)
  async getNewArrivals(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12, days = 30 } = req.query;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));

      const products = await Product.findAll({
        where: {
          isActive: true,
          createdAt: { [Op.gte]: daysAgo },
        },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Category, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "price", "originalPrice", "size", "color"], limit: 1 },
        ],
        order: [["createdAt", "DESC"]],
        limit: Number(limit),
      });

      res.status(200).json({
        message: "New arrivals fetched successfully",
        data: products,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get best selling products
  async getBestSellers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;

      // Aggregate on OrderItem.productId directly (variantId is legacy).
      const bestSellerIds = await OrderItem.findAll({
        attributes: [
          "productId",
          [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQty"],
        ],
        where: { productId: { [Op.ne]: null } },
        group: ["OrderItem.productId"],
        order: [[Sequelize.literal('"totalQty"'), "DESC"]],
        limit: Number(limit),
        raw: true,
      });

      const productIds = [...new Set(bestSellerIds.map((item: any) => item.productId))];

      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds }, isActive: true },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Category, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "price", "originalPrice", "size", "color"], limit: 1 },
        ],
      });

      res.status(200).json({
        message: "Best sellers fetched successfully",
        data: products,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get products on sale (with originalPrice > price)
  async getOnSaleProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 12 } = req.query;

      const variantsOnSale = await Variant.findAll({
        where: {
          originalPrice: { [Op.ne]: null },
          [Op.and]: literal('"originalPrice" > "price"'),
        },
        attributes: ["productId"],
        group: ["productId"],
        limit: Number(limit),
      });

      const productIds = variantsOnSale.map((v) => v.productId);

      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds }, isActive: true },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Category, attributes: ["id", "name"] },
          {
            model: Variant,
            where: { originalPrice: { [Op.ne]: null } },
            attributes: ["id", "price", "originalPrice", "size", "color"],
            limit: 1,
          },
        ],
        limit: Number(limit),
      });

      res.status(200).json({
        message: "On sale products fetched successfully",
        data: products,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get all collections data in one call
  async getAllCollections(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 8 } = req.query;
      const limitNum = Number(limit);

      // Get trending
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // New arrivals
      const newArrivals = await Product.findAll({
        where: {
          isActive: true,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "price", "originalPrice"], limit: 1 },
        ],
        order: [["createdAt", "DESC"]],
        limit: limitNum,
      });

      // On sale (originalPrice > price)
      const variantsOnSale = await Variant.findAll({
        where: {
          originalPrice: { [Op.ne]: null },
          [Op.and]: literal('"originalPrice" > "price"'),
        },
        attributes: ["productId"],
        group: ["productId"],
        limit: limitNum,
      });

      const saleProductIds = variantsOnSale.map((v) => v.productId);

      const onSale = await Product.findAll({
        where: { id: { [Op.in]: saleProductIds }, isActive: true },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Variant, where: { originalPrice: { [Op.ne]: null } }, attributes: ["id", "price", "originalPrice"], limit: 1 },
        ],
        limit: limitNum,
      });

      // Featured (random selection)
      const featured = await Product.findAll({
        where: { isActive: true },
        include: [
          { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
          { model: Brand, attributes: ["id", "name"] },
          { model: Variant, attributes: ["id", "price", "originalPrice"], limit: 1 },
        ],
        order: Sequelize.literal("RANDOM()"),
        limit: limitNum,
      });

      res.status(200).json({
        message: "All collections fetched successfully",
        data: {
          newArrivals,
          onSale,
          featured,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get personalized recommendations for logged-in user
  async getPersonalizedRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { limit = 12 } = req.query;

      let recommendedProducts: any[] = [];

      if (userId) {
        // Get user's last ordered categories
        const userOrders = await Order.findAll({
          where: { userId },
          include: [
            {
              model: OrderItem,
              include: [
                {
                  model: Variant,
                  include: [{ model: Product, attributes: ["categoryId", "brandId"] }],
                },
              ],
            },
          ],
          order: [["createdAt", "DESC"]],
          limit: 5,
        });

        const categoryIds: string[] = [];
        const brandIds: string[] = [];

        userOrders.forEach((order: any) => {
          order.OrderItems?.forEach((item: any) => {
            if (item.Variant?.Product?.categoryId) {
              categoryIds.push(item.Variant.Product.categoryId);
            }
            if (item.Variant?.Product?.brandId) {
              brandIds.push(item.Variant.Product.brandId);
            }
          });
        });

        if (categoryIds.length > 0 || brandIds.length > 0) {
          recommendedProducts = await Product.findAll({
            where: {
              isActive: true,
              [Op.or]: [
                { categoryId: { [Op.in]: [...new Set(categoryIds)] } },
                { brandId: { [Op.in]: [...new Set(brandIds)] } },
              ],
            },
            include: [
              { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
              { model: Brand, attributes: ["id", "name"] },
              { model: Category, attributes: ["id", "name"] },
              { model: Variant, attributes: ["id", "price", "originalPrice"], limit: 1 },
            ],
            order: Sequelize.literal("RANDOM()"),
            limit: Number(limit),
          });
        }
      }

      // Fallback to random products if no personalized recommendations
      if (recommendedProducts.length === 0) {
        recommendedProducts = await Product.findAll({
          where: { isActive: true },
          include: [
            { model: ProductImage, attributes: ["id", "url", "isThumbnail"], limit: 1 },
            { model: Brand, attributes: ["id", "name"] },
            { model: Category, attributes: ["id", "name"] },
            { model: Variant, attributes: ["id", "price", "originalPrice"], limit: 1 },
          ],
          order: Sequelize.literal("RANDOM()"),
          limit: Number(limit),
        });
      }

      res.status(200).json({
        message: "Recommendations fetched successfully",
        data: recommendedProducts,
        isPersonalized: !!userId,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new RecommendationController();
