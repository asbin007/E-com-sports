import type { Request, Response } from "express";
import { PaymentMethod, PaymentStatus, OrderStatus } from "../services/types.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import CartItem from "../database/models/cartItemModel.js";
import Product from "../database/models/productModel.js";
import Category from "../database/models/categoryModel.js";

class OrderController {
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const {
        firstName,
        lastName,
        phoneNumber,
        email,
        addressLine,
        city,
        state,
        zipcode,
        paymentMethod,
        items, // [{ productId, size, quantity, price? }]
      } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (
        !firstName || !lastName || !phoneNumber || !email ||
        !addressLine || !city || !state || !zipcode || !paymentMethod
      ) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      if (![PaymentMethod.COD, PaymentMethod.Khalti].includes(paymentMethod)) {
        res.status(400).json({ message: "Invalid payment method" });
        return;
      }

      let orderItemsData: any[] = [];
      let totalPrice = 0;

      if (items && Array.isArray(items) && items.length > 0) {
        // ── Path 1: items sent from frontend (productId + size) ──────────────
        for (const item of items) {
          const product = await Product.findByPk(item.productId, {
            include: [{ model: Category, attributes: ["needsSize"] }],
          });

          if (!product) {
            res.status(404).json({ message: `Product not found: ${item.productId}` });
            return;
          }

          // Size validation
          const needsSize = (product as any).Category?.needsSize ?? true;
          if (needsSize && !item.size) {
            res.status(400).json({ message: `Size required for ${product.name}` });
            return;
          }

          // Stock check
          if (product.stock < item.quantity) {
            res.status(400).json({
              message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
            });
            return;
          }

          const price = product.price;
          const itemTotal = price * item.quantity;
          totalPrice += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            sku: (product as any).sku || null,
            size: item.size || null,
            color: null,
            quantity: item.quantity,
            price,
            totalPrice: itemTotal,
          });
        }
      } else {
        // ── Path 2: items from backend cart (fallback) ───────────────────────
        const cartItems = await CartItem.findAll({
          where: { userId },
          include: [
            {
              model: Product,
              include: [{ model: Category, attributes: ["needsSize"] }],
            },
          ],
        });

        if (cartItems.length === 0) {
          res.status(400).json({ message: "Cart is empty" });
          return;
        }

        for (const cartItem of cartItems) {
          const product = (cartItem as any).Product as Product;
          if (!product) continue;

          if (product.stock < cartItem.quantity) {
            res.status(400).json({
              message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
            });
            return;
          }

          const price = product.price;
          const itemTotal = price * cartItem.quantity;
          totalPrice += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku || null,
            size: cartItem.size || null,
            color: null,
            quantity: cartItem.quantity,
            price,
            totalPrice: itemTotal,
          });
        }
      }

      const payment = await Payment.create({
        paymentMethod,
        paymentStatus: PaymentStatus.Pending,
        amount: totalPrice,
      });

      const order = await Order.create({
        userId,
        firstName,
        lastName,
        phoneNumber,
        email,
        addressLine,
        city,
        state,
        zipcode,
        totalPrice,
        paymentId: payment.id,
        orderStatus: OrderStatus.Pending,
      });

      for (const itemData of orderItemsData) {
        await OrderItem.create({ orderId: order.id, ...itemData });

        // Decrement stock immediately on COD (reserved on Khalti after payment confirmation)
        if (paymentMethod === PaymentMethod.COD) {
          await Product.decrement("stock", {
            by: itemData.quantity,
            where: { id: itemData.productId },
          });
        }
      }

      if (paymentMethod === PaymentMethod.COD) {
        await CartItem.destroy({ where: { userId } });
      }

      const createdOrder = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, include: [{ model: Product }] },
          { model: Payment },
        ],
      });

      res.status(201).json({
        message: "Order created successfully",
        data: createdOrder,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }


  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { role } = req.user || {};

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const where: any = {};
      if (role === "customer") {
        where.userId = userId;
      }

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: OrderItem,
            include: [{ model: Product }],
          },
          {
            model: Payment,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };
      const { role } = req.user || {};

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const where: any = { id };
      if (role === "customer") {
        where.userId = userId;
      }

      const order = await Order.findOne({
        where,
        include: [
          {
            model: OrderItem,
            include: [{ model: Product }],
          },
          {
            model: Payment,
          },
        ],
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json({
        message: "Order fetched successfully",
        data: order,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default new OrderController();

