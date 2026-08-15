import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { OrderStatus, PaymentStatus } from "../services/types.js";
import Variant from "../database/models/variantModel.js";
import Inventory from "../database/models/inventoryModel.js";
import Product from "../database/models/productModel.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import ProductReview from "../database/models/productReviewModel.js";
import User from "../database/models/userModel.js";
import StatusHistory from "../database/models/statusHistoryModel.js";
import inventoryService from "../services/inventoryService.js";
import notificationService from "../services/notificationService.js";
import { whatsappService } from "../services/whatsappService.js";
import sequelize from "../database/connection/connection.js";
import { Op } from "sequelize";

class AdminController {
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({
          message: "Username, email, and password are required",
        });
        return;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User with this email already exists",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await User.create({
        username,
        email,
        password: hashedPassword,
        role: "admin",
        isVerified: true,
      });

      res.status(201).json({
        message: "Admin created successfully",
        data: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
  async createVariant(req: Request, res: Response): Promise<void> {
    try {
      const { productId, size, color, price, originalPrice, costPrice } = req.body;

      if (!productId || price === undefined || price === null) {
        res.status(400).json({
          message: "productId and price are required",
        });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const variant = await Variant.create({
        productId,
        size,
        color,
        price,
        originalPrice: originalPrice || null,
        costPrice: costPrice || null,
      });

      await Inventory.create({
        variantId: variant.id,
        stock: 0,
        reservedStock: 0,
      });

      const createdVariant = await Variant.findByPk(variant.id, {
        include: [
          {
            model: Product,
          },
          {
            model: Inventory,
          },
        ],
      });

      res.status(201).json({
        message: "Variant created successfully",
        data: createdVariant,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateVariant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { size, color, price, originalPrice, costPrice } = req.body;

      const variant = await Variant.findByPk(id);
      if (!variant) {
        res.status(404).json({ message: "Variant not found" });
        return;
      }

      await variant.update({
        size: size !== undefined ? size : variant.size,
        color: color !== undefined ? color : variant.color,
        price: price !== undefined ? price : variant.price,
        originalPrice: originalPrice !== undefined ? originalPrice : variant.originalPrice,
        costPrice: costPrice !== undefined ? costPrice : variant.costPrice,
      });

      res.status(200).json({
        message: "Variant updated successfully",
        data: variant,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async deleteVariant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const variant = await Variant.findByPk(id);

      if (!variant) {
        res.status(404).json({ message: "Variant not found" });
        return;
      }

      await variant.destroy();

      res.status(200).json({
        message: "Variant deleted successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { variantId, stock } = req.body;

      if (!variantId || stock === undefined) {
        res.status(400).json({
          message: "variantId and stock are required",
        });
        return;
      }

      let inventory = await Inventory.findOne({
        where: { variantId },
      });

      if (!inventory) {
        inventory = await Inventory.create({
          variantId,
          stock,
          reservedStock: 0,
        });
      } else {
        await inventory.update({ stock });
      }

      res.status(200).json({
        message: "Inventory updated successfully",
        data: inventory,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getLowStockItems(req: Request, res: Response): Promise<void> {
    try {
      const { threshold = 10 } = req.query;
      const limit = Number(threshold);

      // Read directly from Variant.stock (canonical source) joined with Product
      const variants = await Variant.findAll({
        where: {
          stock: { [Op.lte]: limit },
          isActive: true,
        },
        include: [{ model: Product, attributes: ["id", "name", "slug", "isActive"] }],
        order: [["stock", "ASC"]],
      });

      const data = variants
        .filter((v: any) => v.Product?.isActive !== false)
        .map((v: any) => ({
          variantId: v.id,
          productId: v.productId,
          productName: v.Product?.name ?? null,
          productSlug: v.Product?.slug ?? null,
          size: v.size,
          color: v.color,
          stock: v.stock,
          isOutOfStock: v.stock <= 0,
          threshold: limit,
        }));

      res.status(200).json({
        message: "Low stock items fetched successfully",
        threshold: limit,
        count: data.length,
        data,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { orderStatus, paymentStatus, deliveryBoyId, note } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Update order status if provided
      if (orderStatus) {
        if (!Object.values(OrderStatus).includes(orderStatus)) {
          res.status(400).json({ message: "Invalid order status" });
          return;
        }
        await order.update({ orderStatus });

        // Create status history entry
        await StatusHistory.create({
          orderId: order.id,
          status: orderStatus,
          note: note || `Status updated to ${orderStatus}`,
        });

        // Send WhatsApp notification
        whatsappService.notifyStatusUpdate(order, orderStatus).catch(() => {});

        // Send email notification
        if (order.email) {
          notificationService.sendOrderStatusEmail(order.email, order.firstName || "Customer", order.id, orderStatus);
        }

        if (orderStatus === OrderStatus.Cancelled) {
          const orderItems = await OrderItem.findAll({ where: { orderId: id } });
          for (const item of orderItems) {
            if (item.variantId) {
              await Variant.increment("stock", {
                by: item.quantity,
                where: { id: item.variantId },
              });
              await inventoryService.releaseStock(item.variantId, item.quantity);
            }
          }
        }
      }

      // Assign delivery boy if provided
      if (deliveryBoyId) {
        if (order.orderStatus === "pending") {
          await order.update({ deliveryBoyId, orderStatus: "preparation" });
          await StatusHistory.create({
            orderId: order.id,
            status: "preparation",
            note: "Delivery boy assigned, moved to preparation",
          });
        } else {
          await order.update({ deliveryBoyId });
          await StatusHistory.create({
            orderId: order.id,
            status: order.orderStatus,
            note: "Delivery boy assigned",
          });
        }

        // Notify delivery boy via WhatsApp
        const deliveryBoy = await User.findByPk(deliveryBoyId);
        if (deliveryBoy?.phoneNumber) {
          whatsappService.notifyDeliveryBoyAssigned(
            deliveryBoy.phoneNumber,
            deliveryBoy.username || "Delivery",
            order
          ).catch(() => {});
        }
      }

      // Update payment status if provided
      if (paymentStatus) {
        if (!Object.values(PaymentStatus).includes(paymentStatus)) {
          res.status(400).json({ message: "Invalid payment status" });
          return;
        }

        // Same guard paymentController.verifyPayment enforces: a payment that is
        // already verified cannot be moved back. A refund is the one legal exit.
        if (order.paymentStatus === PaymentStatus.Paid && paymentStatus !== PaymentStatus.Refunded) {
          res.status(400).json({ message: "Payment already verified" });
          return;
        }

        // Order and Payment must stay in sync: dashboard revenue reads
        // Payment.paymentStatus, while order views read Order.paymentStatus.
        const transaction = await sequelize.transaction();
        try {
          await order.update({ paymentStatus }, { transaction });

          if (order.paymentId) {
            await Payment.update(
              { paymentStatus },
              { where: { id: order.paymentId }, transaction }
            );
          }

          await transaction.commit();
        } catch (error: any) {
          await transaction.rollback();
          throw error;
        }
      }

      // Return updated order
      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem },
          { model: Payment },
          { model: StatusHistory, order: [["createdAt", "ASC"]] },
        ],
      });

      res.status(200).json({
        message: "Order updated successfully",
        data: updatedOrder,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search, rating } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (rating) {
        whereClause.rating = Number(rating);
      }

      const { count, rows: reviews } = await ProductReview.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ["id", "username", "email", "avatar"],
          },
          {
            model: Product,
            attributes: ["id", "name", "slug"],
          },
        ],
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
      });

      // Calculate stats
      const allReviews = await ProductReview.findAll({
        attributes: ["rating"],
      });

      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = allReviews.length > 0 ? totalRatings / allReviews.length : 0;

      res.status(200).json({
        message: "All reviews fetched successfully",
        data: reviews,
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: count,
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

  async toggleReviewVisibility(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { isVisible } = req.body;

      const review = await ProductReview.findByPk(id);
      if (!review) {
        res.status(404).json({ message: "Review not found" });
        return;
      }

      await review.update({ isVisible });

      res.status(200).json({
        message: "Review visibility updated successfully",
        data: review,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new AdminController();

