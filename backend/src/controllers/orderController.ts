import type { Request, Response } from "express";
import { PaymentMethod, PaymentStatus, OrderStatus } from "../services/types.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import CartItem from "../database/models/cartItemModel.js";
import Variant from "../database/models/variantModel.js";
import Product from "../database/models/productModel.js";
import inventoryService from "../services/inventoryService.js";

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
        items, // Accept items from body
      } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (
        !firstName ||
        !lastName ||
        !phoneNumber ||
        !email ||
        !addressLine ||
        !city ||
        !state ||
        !zipcode ||
        !paymentMethod
      ) {
        res.status(400).json({
          message: "All fields are required",
        });
        return;
      }

      if (![PaymentMethod.COD, PaymentMethod.Khalti].includes(paymentMethod)) {
        res.status(400).json({
          message: "Invalid payment method",
        });
        return;
      }

      let orderItemsData: any[] = [];
      let totalPrice = 0;

      if (items && Array.isArray(items) && items.length > 0) {
        // Path 1: Items provided in request (Frontend Cart)
        for (const item of items) {
           const variant = await Variant.findByPk(item.variantId, {
               include: [{ model: Product, attributes: ["id", "name"] }]
           });

           if (!variant) {
               res.status(404).json({ message: `Variant not found: ${item.variantId}`});
               return;
           }

           const hasStock = await inventoryService.checkStock(variant.id, item.quantity);
           if (!hasStock) {
               res.status(400).json({
                   message: `Insufficient stock for ${variant.Product.name} - ${variant.size} ${variant.color}`,
               });
               return;
           }

           const price = variant.salePrice || variant.price;
           const itemTotal = price * item.quantity;
           totalPrice += itemTotal;

           orderItemsData.push({
               variantId: variant.id,
               productName: variant.Product.name,
               sku: variant.sku,
               size: variant.size,
               color: variant.color,
               quantity: item.quantity,
               price: price,
               totalPrice: itemTotal,
           });
        }
      } else {
        // Path 2: Items from Backend Cart (fallback)
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [
            {
                model: Variant,
                include: [
                {
                    model: Product,
                    attributes: ["id", "name"],
                },
                ],
            },
            ],
        });

        if (cartItems.length === 0) {
            res.status(400).json({
            message: "Cart is empty",
            });
            return;
        }

        for (const cartItem of cartItems) {
            const variant = cartItem.Variant;
            const hasStock = await inventoryService.checkStock(
            variant.id,
            cartItem.quantity
            );

            if (!hasStock) {
            res.status(400).json({
                message: `Insufficient stock for ${variant.Product.name} - ${variant.size} ${variant.color}`,
            });
            return;
            }

            const price = variant.salePrice || variant.price;
            const itemTotal = price * cartItem.quantity;
            totalPrice += itemTotal;

            orderItemsData.push({
            variantId: variant.id,
            productName: variant.Product.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            quantity: cartItem.quantity,
            price: price,
            totalPrice: itemTotal,
            });
        }
      }

      const payment = await Payment.create({
        paymentMethod,
        paymentStatus:
          paymentMethod === PaymentMethod.COD
            ? PaymentStatus.Pending
            : PaymentStatus.Pending,
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
        await OrderItem.create({
          orderId: order.id,
          ...itemData,
        });

        if (paymentMethod === PaymentMethod.COD) {
          await inventoryService.reserveStock(itemData.variantId, itemData.quantity);
        }
      }

      if (paymentMethod === PaymentMethod.COD) {
        await CartItem.destroy({ where: { userId } });
      }

      const createdOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            include: [
              {
                model: Variant,
                include: [{ model: Product }],
              },
            ],
          },
          {
            model: Payment,
          },
        ],
      });

      res.status(201).json({
        message: "Order created successfully",
        data: createdOrder,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
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
            include: [
              {
                model: Variant,
                include: [{ model: Product }],
              },
            ],
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
            include: [
              {
                model: Variant,
                include: [{ model: Product }],
              },
            ],
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

