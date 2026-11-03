import { Resend } from "resend";
import { envConfig } from "../config/config.js";
import { getPaymentMethodById } from "../config/paymentMethods.js";

const resend = new Resend(envConfig.resendApiKey);

// Copy for a freshly placed order — reused as the "pending" status message.
const ORDER_PLACED_MESSAGE = {
  subject: "We've received your order 📝",
  body: "Thanks for shopping with Brothers Sports House! We've received your order and our team will review it shortly. We'll email you again the moment it moves into preparation.",
};

const STATUS_MESSAGES: Record<string, { subject: string; body: string }> = {
  pending: ORDER_PLACED_MESSAGE,
  preparation: {
    subject: "Your order is being prepared! 📦",
    body: "Great news! Your order is now being prepared and will be shipped soon.",
  },
  ontheway: {
    subject: "Your order is on the way! 🚚",
    body: "Your order has been picked up by our delivery team and is on its way to you. Please be available at your delivery address.",
  },
  delivered: {
    subject: "Your order has been delivered! ✅",
    body: "Your order has been successfully delivered. Thank you for shopping with Brothers Sports House! We hope you enjoy your purchase.",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    body: "Your order has been cancelled. If payment was made, a refund will be processed. Please contact us if you have any questions.",
  },
};

// Shared layout so every notification email looks identical.
function buildEmailHtml(
  customerName: string,
  bodyText: string,
  orderRef: string,
  statusLabel: string,
  extraBlock: string = ""
): string {
  return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #ea580c;">
              <h1 style="color: #ea580c; margin: 0; font-size: 24px;">Brothers Sports House</h1>
            </div>

            <div style="padding: 30px 0;">
              <p style="font-size: 16px; color: #333;">Hi ${customerName},</p>
              <p style="font-size: 16px; color: #333;">${bodyText}</p>

              <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Order Reference</p>
                <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #111;">${orderRef}</p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">Status: <strong style="color: #ea580c;">${statusLabel}</strong></p>
              </div>
              ${extraBlock}
              <p style="font-size: 14px; color: #666;">
                Need help? Contact us on WhatsApp: <a href="https://wa.me/${envConfig.whatsappNumber}" style="color: #25D366;">+${envConfig.whatsappNumber}</a>
              </p>
            </div>

            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px;">Brothers Sports House • Bardibas, Nepal</p>
            </div>
          </div>
        `;
}

class NotificationService {
  async sendOrderStatusEmail(
    customerEmail: string,
    customerName: string,
    orderId: string,
    newStatus: string
  ): Promise<void> {
    try {
      const statusInfo = STATUS_MESSAGES[newStatus];
      if (!statusInfo) return; // Don't send for unknown statuses

      const orderRef = orderId.slice(-8).toUpperCase();

      await resend.emails.send({
        from: "Brothers Sports House <onboarding@resend.dev>",
        to: customerEmail,
        subject: `Order #${orderRef} - ${statusInfo.subject}`,
        html: buildEmailHtml(
          customerName,
          statusInfo.body,
          `#${orderRef}`,
          newStatus.toUpperCase()
        ),
      });

      console.log(`✅ Email sent to ${customerEmail} for order ${orderRef} (${newStatus})`);
    } catch (error) {
      // Don't throw — email failure shouldn't block the status update
      console.error("⚠️ Failed to send notification email:", error);
    }
  }

  async sendOrderPlacedEmail(
    customerEmail: string,
    customerName: string,
    orderNumber: string,
    paymentMethod: string,
    totalPrice: number
  ): Promise<void> {
    try {
      const statusInfo = ORDER_PLACED_MESSAGE;
      const methodConfig = getPaymentMethodById(paymentMethod);
      const methodLabel = methodConfig?.label || paymentMethod;
      const isCod = methodConfig?.type === "cod";
      const amount = `Rs. ${totalPrice}`;

      const paymentBlock = isCod
        ? `
              <div style="background: #f8f8f8; border-left: 4px solid #ea580c; border-radius: 4px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Payment</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #111;">${methodLabel} — ${amount}</p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">There's nothing to pay right now. Please keep ${amount} ready in cash for our rider when your order arrives.</p>
              </div>
            `
        : `
              <div style="background: #f8f8f8; border-left: 4px solid #ea580c; border-radius: 4px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Payment — awaiting verification</p>
                <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #111;">${methodLabel} — ${amount}</p>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">Your payment has not been confirmed yet. Once you have sent ${amount} and uploaded your payment screenshot, our team checks it by hand and then starts preparing your order. We'll email you as soon as that's done.</p>
              </div>
            `;

      await resend.emails.send({
        from: "Brothers Sports House <onboarding@resend.dev>",
        to: customerEmail,
        subject: `Order ${orderNumber} - ${statusInfo.subject}`,
        html: buildEmailHtml(
          customerName,
          `${statusInfo.body} Please quote your order number below whenever you contact us about this order.`,
          orderNumber,
          "ORDER PLACED",
          paymentBlock
        ),
      });

      console.log(`✅ Order placed email sent to ${customerEmail} for order ${orderNumber}`);
    } catch (error) {
      // Don't throw — email failure must never affect an already-placed order
      console.error("⚠️ Failed to send order placed email:", error);
    }
  }
}

export default new NotificationService();
