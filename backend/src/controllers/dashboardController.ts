import type { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import User from "../database/models/userModel.js";
import Product from "../database/models/productModel.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import Category from "../database/models/categoryModel.js";
import Brand from "../database/models/brandModel.js";

class DashboardController {
  // Get overall stats
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const totalUsers = await User.count({ where: { role: "customer" } });
      const totalProducts = await Product.count({ where: { isActive: true } });
      const totalOrders = await Order.count();
      const totalCategories = await Category.count();
      const totalBrands = await Brand.count();

      // Revenue calculation
      const payments = await Payment.findAll({
        where: { paymentStatus: "paid" },
        attributes: ["amount"],
      });
      const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Pending orders
      const pendingOrders = await Order.count({
        where: { orderStatus: "pending" },
      });

      // Today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = await Order.count({
        where: { createdAt: { [Op.gte]: today } },
      });

      // This month's revenue
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyPayments = await Payment.findAll({
        where: {
          paymentStatus: "paid",
          createdAt: { [Op.gte]: firstDayOfMonth },
        },
        attributes: ["amount"],
      });
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      res.status(200).json({
        message: "Dashboard stats fetched successfully",
        data: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalCategories,
          totalBrands,
          totalRevenue,
          pendingOrders,
          todayOrders,
          monthlyRevenue,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get revenue chart data (last 7 days or 30 days)
  async getRevenueChart(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      const daysNum = Number(days);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
      startDate.setHours(0, 0, 0, 0);

      const orders = await Order.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        include: [
          {
            model: Payment,
            where: { paymentStatus: "paid" },
            attributes: ["amount"],
          },
        ],
        attributes: ["createdAt"],
      });

      // Group by date
      const revenueByDate: { [key: string]: number } = {};

      for (let i = 0; i < daysNum; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().substring(0, 10);
        revenueByDate[dateStr] = 0;
      }

      orders.forEach((order: any) => {
        const dateStr = new Date(order.createdAt).toISOString().substring(0, 10);
        if (revenueByDate[dateStr] !== undefined) {
          revenueByDate[dateStr] += Number(order.Payment?.amount || 0);
        }
      });

      const chartData = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.status(200).json({
        message: "Revenue chart data fetched successfully",
        data: chartData,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get top selling products
  async getTopProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const topProducts = await OrderItem.findAll({
        attributes: [
          "productName",
          [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalQty"],
          [Sequelize.fn("SUM", Sequelize.col("totalPrice")), "totalRevenue"],
        ],
        group: ["productName"],
        order: [[Sequelize.literal('"totalQty"'), "DESC"]],
        limit: Number(limit),
        raw: true,
      });

      res.status(200).json({
        message: "Top products fetched successfully",
        data: topProducts,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get recent orders
  async getRecentOrders(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const orders = await Order.findAll({
        include: [
          {
            model: User,
            attributes: ["id", "username", "email"],
          },
          {
            model: Payment,
            attributes: ["paymentMethod", "paymentStatus", "amount"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: Number(limit),
      });

      res.status(200).json({
        message: "Recent orders fetched successfully",
        data: orders,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get orders by status
  async getOrdersByStatus(req: Request, res: Response): Promise<void> {
    try {
      const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

      const ordersByStatus = await Promise.all(
        statuses.map(async (status) => {
          const count = await Order.count({ where: { orderStatus: status } });
          return { status, count };
        })
      );

      res.status(200).json({
        message: "Orders by status fetched successfully",
        data: ordersByStatus,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get sales by category
  async getSalesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Product,
            attributes: ["id"],
          },
        ],
      });

      const salesByCategory = await Promise.all(
        categories.map(async (category: any) => {
          const productIds = category.Products?.map((p: any) => p.id) || [];

          if (productIds.length === 0) {
            return { category: category.name, sales: 0, revenue: 0 };
          }

          // This is a simplified approach - in production you'd join through variants
          return {
            category: category.name,
            productCount: productIds.length,
          };
        })
      );

      res.status(200).json({
        message: "Sales by category fetched successfully",
        data: salesByCategory,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new DashboardController();
