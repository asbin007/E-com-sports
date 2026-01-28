import type { Request, Response } from "express";
import { OrderStatus } from "../services/types.js";
import Variant from "../database/models/variantModel.js";
import Inventory from "../database/models/inventoryModel.js";
import Product from "../database/models/productModel.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import inventoryService from "../services/inventoryService.js";
import { Op } from "sequelize";

class AdminController {
  async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      const { User } = require("../database/models/userModel"); // Dynamic import to avoid circular dependency if any
      const bcrypt = require("bcrypt");

      if (!username || !email || !password) {
        res.status(400).json({
          message: "Username, email, and password are required",
        });
        return;
      }

      const existingUser = await User.default.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User with this email already exists",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await User.default.create({
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
        error: error.message,
      });
    }
  }
  async createVariant(req: Request, res: Response): Promise<void> {
    try {
      const { productId, size, color, sku, price, salePrice } = req.body;

      if (!productId || !sku || !price) {
        res.status(400).json({
          message: "productId, sku, and price are required",
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
        sku,
        price,
        salePrice,
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
        error: error.message,
      });
    }
  }

  async updateVariant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { size, color, sku, price, salePrice } = req.body;

      const variant = await Variant.findByPk(id);
      if (!variant) {
        res.status(404).json({ message: "Variant not found" });
        return;
      }

      await variant.update({
        size: size !== undefined ? size : variant.size,
        color: color !== undefined ? color : variant.color,
        sku: sku || variant.sku,
        price: price !== undefined ? price : variant.price,
        salePrice: salePrice !== undefined ? salePrice : variant.salePrice,
      });

      res.status(200).json({
        message: "Variant updated successfully",
        data: variant,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
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
        error: error.message,
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
        error: error.message,
      });
    }
  }

  async getLowStockItems(req: Request, res: Response): Promise<void> {
    try {
      const { threshold = 10 } = req.query;

      const inventoryItems = await Inventory.findAll({
        where: {
          stock: {
            [Op.lte]: Number(threshold),
          },
        },
        include: [
          {
            model: Variant,
            include: [{ model: Product }],
          },
        ],
      });

      res.status(200).json({
        message: "Low stock items fetched successfully",
        data: inventoryItems,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { orderStatus } = req.body;

      if (!Object.values(OrderStatus).includes(orderStatus)) {
        res.status(400).json({
          message: "Invalid order status",
        });
        return;
      }

      const order = await Order.findByPk(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      await order.update({ orderStatus });

      if (orderStatus === OrderStatus.Cancelled) {
        const orderItems = await OrderItem.findAll({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          await inventoryService.releaseStock(item.variantId, item.quantity);
        }
      }

      res.status(200).json({
        message: "Order status updated successfully",
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

export default new AdminController();

