import type { Request, Response } from "express";
import Order from "../database/models/orderModel.js";
import Payment from "../database/models/paymentModel.js";
import { getEnabledPaymentMethods } from "../config/paymentMethods.js";

class PaymentController {
  /**
   * Public: list the payment methods the checkout page can offer.
   * Only enabled methods are returned.
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const methods = getEnabledPaymentMethods();

      res.status(200).json({
        message: "Payment methods fetched",
        data: methods,
      });
    } catch (error: any) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Customer uploads payment proof (screenshot + transaction ID) after placing an order.
   * Called from checkout or order detail page.
   */
  async uploadPaymentProof(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const userId = (req as any).user?.id;
      const { transactionId } = req.body;

      const order = await Order.findByPk(orderId);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Only the order owner can upload payment proof
      if (order.userId !== userId) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }

      if (order.paymentStatus === "paid") {
        res.status(400).json({ message: "Payment already verified" });
        return;
      }

      // Get uploaded screenshot URL from Cloudinary (via multer middleware)
      const file = req.file as Express.Multer.File | undefined;
      const screenshotUrl = file ? ((file as any).path || (file as any).secure_url) : null;

      if (!screenshotUrl && !transactionId) {
        res.status(400).json({ message: "Please provide a payment screenshot or transaction ID" });
        return;
      }

      // Update order with payment proof
      const updateData: any = {};
      if (screenshotUrl) updateData.paymentScreenshot = screenshotUrl;
      if (transactionId) updateData.paymentPid = transactionId;

      // A re-submission after a rejection goes back into the verification queue
      // and drops the stale rejection reason.
      if (order.paymentStatus === "failed") {
        updateData.paymentStatus = "pending";
        updateData.paymentRejectionReason = null;
      }

      await order.update(updateData);

      if (updateData.paymentStatus === "pending" && order.paymentId) {
        await Payment.update(
          { paymentStatus: "pending" },
          { where: { id: order.paymentId } }
        );
      }

      res.status(200).json({
        message: "Payment proof uploaded successfully. Awaiting admin verification.",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentScreenshot: order.paymentScreenshot,
          paymentPid: order.paymentPid,
          paymentStatus: order.paymentStatus,
        },
      });
    } catch (error: any) {
      console.error("Upload payment proof error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Admin verifies a payment by confirming the screenshot/transaction ID is valid.
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params as { orderId: string };

      const order = await Order.findByPk(orderId);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.paymentStatus === "paid") {
        res.status(400).json({ message: "Payment already verified" });
        return;
      }

      await order.update({ paymentStatus: "paid", paymentRejectionReason: null });

      if (order.paymentId) {
        await Payment.update(
          { paymentStatus: "paid" },
          { where: { id: order.paymentId } }
        );
      }

      res.status(200).json({
        message: "Payment verified successfully",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: "paid",
          paymentMethod: order.paymentMethod,
          paymentPid: order.paymentPid,
          paymentScreenshot: order.paymentScreenshot,
        },
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Admin rejects a payment (invalid screenshot or transaction ID).
   */
  async rejectPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const { reason } = req.body;

      const order = await Order.findByPk(orderId);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.paymentStatus === "paid") {
        res.status(400).json({ message: "Cannot reject an already verified payment" });
        return;
      }

      const rejectionReason =
        typeof reason === "string" && reason.trim()
          ? reason.trim()
          : "Payment could not be verified";

      await order.update({
        paymentStatus: "failed",
        paymentRejectionReason: rejectionReason,
      });

      if (order.paymentId) {
        await Payment.update(
          { paymentStatus: "failed" },
          { where: { id: order.paymentId } }
        );
      }

      res.status(200).json({
        message: "Payment rejected",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: "failed",
          reason: rejectionReason,
        },
      });
    } catch (error: any) {
      console.error("Payment rejection error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Get payment status for an order (customer or admin).
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params as { orderId: string };
      const userId = (req as any).user?.id;
      const role = (req as any).user?.role;

      const order = await Order.findByPk(orderId);

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // Only admins may read another user's order; everyone else must own it
      if (role !== "admin" && order.userId !== userId) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }

      res.status(200).json({
        message: "Payment status fetched",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentPid: order.paymentPid,
          paymentScreenshot: order.paymentScreenshot,
          paymentRejectionReason: order.paymentRejectionReason,
          totalPrice: order.totalPrice,
        },
      });
    } catch (error: any) {
      console.error("Get payment status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default new PaymentController();
