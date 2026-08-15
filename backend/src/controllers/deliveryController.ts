import type { Request, Response } from "express";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Payment from "../database/models/paymentModel.js";
import Product from "../database/models/productModel.js";
import StatusHistory from "../database/models/statusHistoryModel.js";
import { Op } from "sequelize";
import notificationService from "../services/notificationService.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparation"],
  preparation: ["ontheway"],
  ontheway: ["delivered"],
};

class DeliveryController {
  // Get orders assigned to this delivery boy only
  async getDeliveryOrders(req: Request, res: Response): Promise<void> {
    try {
      const deliveryBoyId = req.user?.id;

      const orders = await Order.findAll({
        where: {
          deliveryBoyId,
          orderStatus: { [Op.notIn]: ["cancelled"] },
        },
        include: [
          { model: OrderItem, include: [{ model: Product }] },
          { model: Payment },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Delivery orders fetched",
        data: orders,
      });
    } catch (error: any) {
      console.error("Delivery getOrders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update order status — auto-assigns to delivery boy on first action
  async updateDeliveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body;
      const deliveryBoyId = req.user?.id;

      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }

      const order = await Order.findByPk(id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Check if order is assigned to someone else
      if (order.deliveryBoyId && order.deliveryBoyId !== deliveryBoyId) {
        res.status(403).json({ message: "This order is assigned to another delivery person" });
        return;
      }

      const currentStatus = order.orderStatus || "pending";
      const allowedNext = VALID_TRANSITIONS[currentStatus];

      if (!allowedNext || !allowedNext.includes(status)) {
        res.status(400).json({
          message: `Cannot change from "${currentStatus}" to "${status}". Allowed: ${allowedNext?.join(", ") || "none"}`,
        });
        return;
      }

      // Auto-assign to this delivery boy if not already assigned
      const updateData: any = { orderStatus: status };
      if (!order.deliveryBoyId) {
        updateData.deliveryBoyId = deliveryBoyId;
      }

      await order.update(updateData);

      // Create status history entry
      await StatusHistory.create({
        orderId: order.id,
        status,
        note: `Status updated to ${status} by delivery`,
      });

      // Send email notification to customer
      if (order.email) {
        notificationService.sendOrderStatusEmail(
          order.email,
          order.firstName || "Customer",
          order.id,
          status
        );
      }

      res.status(200).json({
        message: `Order status updated to "${status}"`,
        data: order,
      });
    } catch (error: any) {
      console.error("Delivery updateStatus error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default new DeliveryController();
