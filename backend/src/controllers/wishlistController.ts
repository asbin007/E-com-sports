import type { Request, Response } from "express";
import Wishlist from "../database/models/wishlistModel.js";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Brand from "../database/models/brandModel.js";
import Category from "../database/models/categoryModel.js";

class WishlistController {
  async addToWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId } = req.params as { productId: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const existing = await Wishlist.findOne({
        where: { userId, productId },
      });

      if (existing) {
        res.status(400).json({ message: "Product already in wishlist" });
        return;
      }

      await Wishlist.create({ userId, productId });

      res.status(201).json({
        message: "Product added to wishlist",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async removeFromWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId } = req.params as { productId: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const wishlistItem = await Wishlist.findOne({
        where: { userId, productId },
      });

      if (!wishlistItem) {
        res.status(404).json({ message: "Product not in wishlist" });
        return;
      }

      await wishlistItem.destroy();

      res.status(200).json({
        message: "Product removed from wishlist",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const wishlist = await Wishlist.findAll({
        where: { userId },
        include: [
          {
            model: Product,
            include: [
              {
                model: ProductImage,
                attributes: ["id", "url", "isThumbnail"],
                limit: 1,
              },
              {
                model: Brand,
                attributes: ["id", "name"],
              },
              {
                model: Category,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Wishlist fetched successfully",
        data: wishlist,
        count: wishlist.length,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async toggleWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId } = req.params as { productId: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const existing = await Wishlist.findOne({
        where: { userId, productId },
      });

      if (existing) {
        await existing.destroy();
        res.status(200).json({
          message: "Product removed from wishlist",
          isInWishlist: false,
        });
      } else {
        await Wishlist.create({ userId, productId });
        res.status(200).json({
          message: "Product added to wishlist",
          isInWishlist: true,
        });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async checkWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId } = req.params as { productId: string };

      if (!userId) {
        res.status(200).json({ isInWishlist: false });
        return;
      }

      const existing = await Wishlist.findOne({
        where: { userId, productId },
      });

      res.status(200).json({
        isInWishlist: !!existing,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new WishlistController();
