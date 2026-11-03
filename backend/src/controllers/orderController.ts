import type { Request, Response } from "express";
import { PaymentMethod, PaymentStatus, OrderStatus } from "../services/types.js";
import { getPaymentMethodById } from "../config/paymentMethods.js";
import sequelize from "../database/connection/connection.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import CartItem from "../database/models/cartItemModel.js";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Category from "../database/models/categoryModel.js";
import Variant from "../database/models/variantModel.js";
import StatusHistory from "../database/models/statusHistoryModel.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { calculateDeliveryCharge } from "../utils/deliveryCharge.js";
import { escapeCsvCell } from "../utils/csv.js";
import { whatsappService } from "../services/whatsappService.js";
import notificationService from "../services/notificationService.js";

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
        items,
        note,
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

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }

      // Validate phone number (basic check for digits)
      if (!/^\d{7,15}$/.test(phoneNumber.replace(/[\s\-+()]/g, ""))) {
        res.status(400).json({ message: "Invalid phone number" });
        return;
      }

      const selectedPaymentMethod = getPaymentMethodById(paymentMethod);
      if (
        ![
          PaymentMethod.QR,
          PaymentMethod.Esewa,
          PaymentMethod.Khalti,
          PaymentMethod.Bank,
          PaymentMethod.COD,
        ].includes(paymentMethod) ||
        selectedPaymentMethod?.enabled === false
      ) {
        res.status(400).json({ message: "Invalid payment method" });
        return;
      }

      let orderItemsData: any[] = [];
      let subtotal = 0;

      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const product = await Product.findByPk(item.productId, {
            include: [
              { model: Category, attributes: ["needsSize"] },
              { model: Variant, as: "variants" }
            ],
          });

          if (!product) {
            res.status(404).json({ message: `Product not found: ${item.productId}` });
            return;
          }

          const needsSize = (product as any).Category?.needsSize ?? true;
          if (needsSize && !item.size) {
            res.status(400).json({ message: `Size required for ${product.name}` });
            return;
          }

          let targetVariant: any = null;

          if (item.variantId) {
            targetVariant = (product as any).variants?.find(
              (v: any) => v.id === item.variantId,
            );
          } else if (needsSize && item.size) {
            targetVariant = (product as any).variants?.find(
              (v: any) => v.size === item.size && (!item.color || v.color === item.color),
            );
          } else {
            targetVariant = (product as any).variants?.[0];
          }

          if (!targetVariant) {
            res.status(400).json({ message: `Config for ${product.name} not available` });
            return;
          }

          if (targetVariant.stock < item.quantity) {
            res.status(400).json({
              message: `Insufficient stock for ${product.name}. Only ${targetVariant.stock} left.`,
            });
            return;
          }

          const price = targetVariant.price;
          const itemTotal = price * item.quantity;
          subtotal += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            sku: null,
            size: item.size || null,
            color: targetVariant.color || null,
            quantity: item.quantity,
            variantId: targetVariant.id,
            price,
            totalPrice: itemTotal,
          });
        }
      } else {
        const cartItems = await CartItem.findAll({
          where: { userId },
          include: [
            {
              model: Product,
              include: [
                { model: Category, attributes: ["needsSize"] },
                { model: Variant, as: "variants" }
              ],
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

          const needsSize = (product as any).Category?.needsSize ?? true;
          let targetVariant: any = null;

          if (needsSize && cartItem.size) {
            targetVariant = (product as any).variants?.find((v: any) => v.size === cartItem.size);
          } else {
            targetVariant = (product as any).variants?.[0];
          }

          if (!targetVariant) continue;

          if (targetVariant.stock < cartItem.quantity) {
            res.status(400).json({
              message: `Insufficient stock for ${product.name}. Only ${targetVariant.stock} left.`,
            });
            return;
          }

          const price = targetVariant.price;
          const itemTotal = price * cartItem.quantity;
          subtotal += itemTotal;

          orderItemsData.push({
            productId: product.id,
            productName: product.name,
            sku: null,
            size: cartItem.size || null,
            color: targetVariant.color || null,
            quantity: cartItem.quantity,
            variantId: targetVariant.id,
            price,
            totalPrice: itemTotal,
          });
        }
      }

      // Calculate delivery charge based on city
      const deliveryCharge = calculateDeliveryCharge(city);
      const totalPrice = subtotal + deliveryCharge;
      const orderNumber = generateOrderNumber();

      // Use transaction for data consistency
      const transaction = await sequelize.transaction();

      try {
        const payment = await Payment.create({
          paymentMethod,
          paymentStatus: PaymentStatus.Pending,
          amount: totalPrice,
        }, { transaction });

        const order = await Order.create({
          orderNumber,
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
          subtotal,
          deliveryCharge,
          customerNote: note || null,
          paymentId: payment.id,
          paymentMethod,
          orderStatus: OrderStatus.Pending,
        }, { transaction });

        // Lock variants and verify stock atomically to prevent overselling
        for (const itemData of orderItemsData) {
          await OrderItem.create({ orderId: order.id, ...itemData }, { transaction });

          if (itemData.variantId) {
            // SELECT ... FOR UPDATE locks the row until transaction completes
            const lockedVariant = await Variant.findByPk(itemData.variantId, {
              lock: transaction.LOCK.UPDATE,
              transaction,
            });

            if (!lockedVariant || lockedVariant.stock < itemData.quantity) {
              await transaction.rollback();
              res.status(409).json({
                message: `Insufficient stock for ${itemData.productName}. Item may have been purchased by another customer.`,
              });
              return;
            }

            await lockedVariant.decrement("stock", {
              by: itemData.quantity,
              transaction,
            });
          }
        }

        // Create initial status history
        await StatusHistory.create({
          orderId: order.id,
          status: "pending",
          note: "Order placed",
        }, { transaction });

        // Clear cart
        await CartItem.destroy({ where: { userId }, transaction });

        await transaction.commit();

        // Fetch complete order
        const createdOrder = await Order.findByPk(order.id, {
          include: [
            { model: OrderItem, include: [{ model: Product }] },
            { model: Payment },
            { model: StatusHistory },
          ],
        });

        // Generate WhatsApp URL for manual confirmation
        const whatsappUrl = whatsappService.generateWhatsAppUrl(
          phoneNumber,
          generateWhatsAppMessage(createdOrder)
        );

        // Fire-and-forget WhatsApp notification
        whatsappService.notifyOrderPlaced(createdOrder).catch(() => {});

        // Fire-and-forget order confirmation email (after commit — must never
        // affect an order that has already been written to the database)
        if (email) {
          notificationService.sendOrderPlacedEmail(
            email,
            firstName || "Customer",
            orderNumber,
            paymentMethod,
            totalPrice
          );
        }

        res.status(201).json({
          message: "Order created successfully",
          data: createdOrder,
          whatsappUrl,
          orderNumber,
        });
      } catch (txError) {
        await transaction.rollback();
        throw txError;
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
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
      } else if (role === "delivery") {
        // Delivery staff only see orders assigned to them
        where.deliveryBoyId = userId;
      }

      // Filter by status if provided
      const { status, page = 1, limit = 20 } = req.query;
      if (status && typeof status === "string") {
        where.orderStatus = status;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: ProductImage,
                    as: "ProductImages",
                    attributes: ["id", "url", "isThumbnail", "sortOrder"],
                  },
                ],
              },
            ],
          },
          { model: Payment },
          { model: StatusHistory, order: [["createdAt", "ASC"]] },
        ],
        order: [["createdAt", "DESC"]],
        limit: Number(limit),
        offset,
        distinct: true, // Ensures count is correct with includes
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: orders,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
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
      } else if (role === "delivery") {
        where.deliveryBoyId = userId;
      }

      const order = await Order.findOne({
        where,
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: ProductImage,
                    as: "ProductImages",
                    attributes: ["id", "url", "isThumbnail", "sortOrder"],
                  },
                ],
              },
            ],
          },
          { model: Payment },
          { model: StatusHistory, order: [["createdAt", "ASC"]] },
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
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { status, note } = req.body;

      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }

      const order = await Order.findByPk(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      await order.update({ orderStatus: status });

      // Create status history entry
      await StatusHistory.create({
        orderId: order.id,
        status,
        note: note || `Status updated to ${status}`,
      });

      // Fetch updated order with history
      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem, include: [{ model: Product }] },
          { model: Payment },
          { model: StatusHistory, order: [["createdAt", "ASC"]] },
        ],
      });

      // Fire-and-forget WhatsApp notification
      whatsappService.notifyStatusUpdate(updatedOrder, status).catch(() => {});

      // Send email notification
      if (order.email) {
        notificationService.sendOrderStatusEmail(
          order.email,
          order.firstName || "Customer",
          order.id,
          status
        );
      }

      res.status(200).json({
        message: "Order status updated",
        data: updatedOrder,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const order = await Order.findOne({
        where: { id, userId },
        include: [{ model: OrderItem }, { model: Payment }],
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      const currentStatus = order.orderStatus || "pending";
      if (currentStatus === "delivered") {
        res.status(400).json({ message: "Cannot cancel a delivered order" });
        return;
      }
      if (currentStatus === "cancelled") {
        res.status(400).json({ message: "Order is already cancelled" });
        return;
      }
      if (currentStatus === "ontheway") {
        res.status(400).json({ message: "Cannot cancel an order that is on the way" });
        return;
      }

      await order.update({ orderStatus: "cancelled" });

      // Restore stock
      const orderItems = await OrderItem.findAll({ where: { orderId: id } });
      for (const item of orderItems) {
        if (item.variantId) {
          await Variant.increment("stock", {
            by: item.quantity,
            where: { id: item.variantId },
          });
        }
      }

      // Create status history
      await StatusHistory.create({
        orderId: order.id,
        status: "cancelled",
        note: "Cancelled by customer",
      });

      // Mark payment as refunded if paid
      if (order.paymentId) {
        const payment = await Payment.findByPk(order.paymentId);
        if (payment && payment.paymentStatus === "paid") {
          await payment.update({ paymentStatus: "refunded" });
        }
      }

      res.status(200).json({
        message: "Order cancelled successfully",
        data: order,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async assignDeliveryBoy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { deliveryBoyId } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      await order.update({ deliveryBoyId: deliveryBoyId || null });

      // Create status history
      await StatusHistory.create({
        orderId: order.id,
        status: order.orderStatus,
        note: deliveryBoyId ? `Delivery boy assigned` : `Delivery boy unassigned`,
      });

      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem, include: [{ model: Product }] },
          { model: Payment },
          { model: StatusHistory, order: [["createdAt", "ASC"]] },
        ],
      });

      res.status(200).json({
        message: "Delivery boy assigned",
        data: updatedOrder,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async exportOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await Order.findAll({
        include: [
          { model: OrderItem },
        ],
        order: [["createdAt", "DESC"]],
      });

      const header = 'Order Number,Customer,Phone,City,Items,Subtotal,Delivery,Total,Status,Payment,Date';
      const rows = orders.map((o: any) => {
        const items = o.OrderItems?.map((i: any) => `${i.productName}(${i.size})x${i.quantity}`).join('; ') || '';
        return [
          o.orderNumber || o.id.slice(-8),
          `${o.firstName} ${o.lastName}`,
          o.phoneNumber,
          o.city,
          items,
          o.subtotal || o.totalPrice,
          o.deliveryCharge || 0,
          o.totalPrice,
          o.orderStatus,
          o.paymentStatus,
          o.createdAt?.toISOString?.()?.split('T')[0] || '',
        ].map(escapeCsvCell).join(',');
      });

      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      res.send(csv);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Failed to export orders" });
    }
  }
}

function generateWhatsAppMessage(order: any): string {
  const lines: string[] = [];

  lines.push('🏆 NEW ORDER — Brothers Sports House');
  lines.push(`📋 Order: ${order.orderNumber || order.id?.slice(-8)}`);
  lines.push('');
  lines.push(`👤 Customer: ${order.firstName} ${order.lastName}`);
  lines.push(`📱 Phone: ${order.phoneNumber}`);
  lines.push(`📍 Address: ${order.addressLine}, ${order.city}`);
  lines.push('');
  lines.push('🛒 Items:');

  for (const item of order.OrderItems || []) {
    lines.push(`  • ${item.productName} (${item.size || 'N/A'}) x${item.quantity} - Rs.${item.price}`);
  }

  lines.push('');
  lines.push(`💰 Subtotal: Rs.${order.subtotal || order.totalPrice}`);
  lines.push(`🚚 Delivery: Rs.${order.deliveryCharge || 0}`);
  lines.push(`💵 Total: Rs.${order.totalPrice}`);
  lines.push('💳 Payment: Cash on Delivery');

  if (order.customerNote) {
    lines.push(`📝 Note: ${order.customerNote}`);
  }

  return lines.join('\n');
}

export default new OrderController();
