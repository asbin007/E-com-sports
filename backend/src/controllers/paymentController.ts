import type { Request, Response } from "express";
import axios from "axios";
import Order from "../database/models/orderModel.js";
import { envConfig } from "../config/config.js";

class PaymentController {
  async initializeKhalti(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, amount } = req.body;

      if (!orderId || !amount) {
        res.status(400).json({ message: "Order ID and Amount are required" });
        return;
      }

      const order = await Order.findByPk(orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      // --- DUMMY MODE FOR TESTING ---
      if (process.env.NODE_ENV === "development") {
        console.log("DEBUG: Using Dummy Payment for Order #", orderId);
        await order.update({ paymentMethod: "Khalti" });
        res.status(200).json({
          message: "Payment initiated successfully (DUMMY MODE)",
          payment_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}&pidx=DUMMY_ORDER_${orderId}_${Date.now()}`,
          pidx: `DUMMY_ORDER_${orderId}_${Date.now()}`,
        });
        return;
      }
      // --- END DUMMY MODE ---

      const payload = {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        website_url: process.env.FRONTEND_URL,
        amount: amount * 100, // Amount in paisa
        purchase_order_id: orderId,
        purchase_order_name: `Order #${orderId}`,
        customer_info: {
             name: order.firstName + " " + order.lastName,
             email: order.email,
             phone: order.phoneNumber || "9800000000"
        }
      };

      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/initiate/",
        payload,
        {
          headers: {
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      await order.update({paymentMethod : "Khalti"});

      res.status(200).json({
        message: "Payment initiated successfully",
        payment_url: response.data.payment_url,
        pidx: response.data.pidx,
      });
    } catch (error: any) {
      console.error("Khalti initialization error:", error.response?.data || error.message);
      res.status(500).json({
        message: "Failed to initiate payment",
        error: error.response?.data || error.message,
      });
    }
  }

  async verifyKhalti(req: Request, res: Response): Promise<void> {
    try {
      const { pidx } = req.body;

      if (!pidx) {
        res.status(400).json({ message: "PIDX is required" });
        return;
      }

      // --- DUMMY MODE FOR TESTING ---
      if (pidx.startsWith("DUMMY_")) {
        const orderId = req.body.orderId || pidx.split("_")[2]; // fallback if orderId not sent directly
        const order = await Order.findByPk(orderId);
        if (order) {
          await order.update({ paymentStatus: "paid", paymentPid: pidx });
          res.status(200).json({
            message: "Payment verified (DUMMY MODE)",
            data: { status: "Completed", purchase_order_id: orderId },
          });
          return;
        }
      }
      // --- END DUMMY MODE ---

      const response = await axios.post(
        "https://a.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        {
          headers: {
            Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "Completed") {
        // Update order status
        const orderId = response.data.purchase_order_id;
        const order = await Order.findByPk(orderId);

        if (order) {
          order.paymentStatus = "paid";
          order.paymentPid = pidx;
          await order.save();
        }

        res.status(200).json({
          message: "Payment verified successfully",
          data: response.data,
        });
      } else {
        res.status(400).json({
          message: "Payment verification failed",
          status: response.data.status,
        });
      }
    } catch (error: any) {
      console.error("Khalti verification error:", error.response?.data || error.message);
      res.status(500).json({
        message: "Failed to verify payment",
        error: error.response?.data || error.message,
      });
    }
  }
}

export default new PaymentController();
