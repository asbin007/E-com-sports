import type { Request, Response } from "express";
import ProductReview from "../database/models/productReviewModel.js";
import Product from "../database/models/productModel.js";
import User from "../database/models/userModel.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";

class ReviewController {
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId, rating, title, comment } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!productId || !rating) {
        res.status(400).json({ message: "Product ID and rating are required" });
        return;
      }

      if (rating < 1 || rating > 5) {
        res.status(400).json({ message: "Rating must be between 1 and 5" });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const existingReview = await ProductReview.findOne({
        where: { userId, productId },
      });

      if (existingReview) {
        res.status(400).json({ message: "You have already reviewed this product" });
        return;
      }

      // Check if user has purchased this product
      const hasPurchased = await OrderItem.findOne({
        where: { productId },
        include: [
          {
            model: Order,
            where: { userId },
            required: true,
          },
        ],
      });

      const review = await ProductReview.create({
        userId,
        productId,
        rating,
        title,
        comment,
        isVerifiedPurchase: !!hasPurchased,
      });

      const createdReview = await ProductReview.findByPk(review.id, {
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
      });

      res.status(201).json({
        message: "Review created successfully",
        data: createdReview,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getProductReviews(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params as { productId: string };
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: reviews } = await ProductReview.findAndCountAll({
        where: { productId, isVisible: true },
        include: [
          {
            model: User,
            attributes: ["id", "username", "avatar"],
          },
        ],
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
      });

      // Calculate average rating
      const allReviews = await ProductReview.findAll({
        where: { productId, isVisible: true },
        attributes: ["rating"],
      });

      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = allReviews.length > 0 ? totalRatings / allReviews.length : 0;

      // Rating distribution
      const ratingDistribution = {
        1: allReviews.filter((r) => r.rating === 1).length,
        2: allReviews.filter((r) => r.rating === 2).length,
        3: allReviews.filter((r) => r.rating === 3).length,
        4: allReviews.filter((r) => r.rating === 4).length,
        5: allReviews.filter((r) => r.rating === 5).length,
      };

      res.status(200).json({
        message: "Reviews fetched successfully",
        data: reviews,
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: count,
          ratingDistribution,
        },
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };
      const { rating, title, comment } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const review = await ProductReview.findByPk(id);

      if (!review) {
        res.status(404).json({ message: "Review not found" });
        return;
      }

      if (review.userId !== userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Not authorized to update this review" });
        return;
      }

      if (rating && (rating < 1 || rating > 5)) {
        res.status(400).json({ message: "Rating must be between 1 and 5" });
        return;
      }

      await review.update({
        rating: rating || review.rating,
        title: title !== undefined ? title : review.title,
        comment: comment !== undefined ? comment : review.comment,
      });

      res.status(200).json({
        message: "Review updated successfully",
        data: review,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const review = await ProductReview.findByPk(id);

      if (!review) {
        res.status(404).json({ message: "Review not found" });
        return;
      }

      if (review.userId !== userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Not authorized to delete this review" });
        return;
      }

      // Soft delete - just hide it
      await review.update({ isVisible: false });

      res.status(200).json({
        message: "Review deleted successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getMyReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const reviews = await ProductReview.findAll({
        where: { userId },
        include: [
          {
            model: Product,
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Reviews fetched successfully",
        data: reviews,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ReviewController();
