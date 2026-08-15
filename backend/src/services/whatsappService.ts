/**
 * WhatsApp notification service.
 * 
 * Uses WAHA (WhatsApp HTTP API) for auto-send when configured.
 * Falls back gracefully if WAHA is not set up.
 * 
 * WAHA_URL must be set to the external URL of your deployed WAHA service.
 * e.g. WAHA_URL=https://waha.yourservice.onrender.com
 */

const WAHA_URL = process.env.WAHA_URL;
const SESSION = process.env.WAHA_SESSION || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '9779748477628';

function validateWahaConfig(): string | null {
  if (!WAHA_URL) return 'WAHA_URL not set';
  if (
    process.env.NODE_ENV === 'production' &&
    (WAHA_URL.includes('localhost') || WAHA_URL.includes('127.0.0.1'))
  ) {
    return `WAHA_URL is localhost (${WAHA_URL}) — unreachable in production`;
  }
  return null;
}

/**
 * Formats a Nepali phone number to WhatsApp chatId format.
 * e.g. "9841234567" → "9779841234567@c.us"
 */
function toChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('977') ? digits : `977${digits}`;
  return `${normalized}@c.us`;
}

/**
 * Core send — POSTs to WAHA's /api/sendText endpoint.
 * Errors are caught and logged but never rethrown — a WhatsApp
 * failure must never block an order or other business logic.
 */
export async function sendText(phone: string, text: string): Promise<void> {
  const configError = validateWahaConfig();
  if (configError) {
    console.warn(`[WAHA] Skipping sendText — ${configError}`);
    return;
  }

  const chatId = toChatId(phone);
  const url = `${WAHA_URL}/api/sendText`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WAHA_API_KEY ? { 'X-Api-Key': WAHA_API_KEY } : {}),
      },
      body: JSON.stringify({ session: SESSION, chatId, text }),
    });

    if (!res.ok) {
      console.error(`[WAHA] sendText failed — status=${res.status} chatId=${chatId}`);
    }
  } catch (err: any) {
    if (err?.code === 'ECONNREFUSED') {
      console.error(`[WAHA] ECONNREFUSED — Cannot reach WAHA at ${WAHA_URL}`);
    } else {
      console.error(`[WAHA] sendText error:`, err.message);
    }
  }
}

/**
 * Generate a wa.me link for manual WhatsApp confirmation.
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('977') ? digits : `977${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Notify customer when order is placed.
 */
export async function notifyOrderPlaced(order: any): Promise<void> {
  if (!order.phoneNumber && !order.customerPhone) return;

  const phone = order.phoneNumber || order.customerPhone;
  const orderNumber = order.orderNumber || order.id?.slice(-8).toUpperCase();
  const itemLines = (order.OrderItems || order.items || [])
    .map((i: any) => `  • ${i.productName} (${i.size || 'N/A'}) ×${i.quantity} — Rs.${i.price}`)
    .join('\n');

  const message = [
    `🏆 *Order Confirmed — Brothers Sports House*`,
    ``,
    `Hi ${order.firstName || order.customerName}! Your order has been received.`,
    ``,
    `📋 Order: *${orderNumber}*`,
    ``,
    `🛒 *Items:*`,
    itemLines || '  • (items loading)',
    ``,
    `💰 Total: *Rs.${order.totalPrice || order.total}*`,
    `💳 Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}`,
    ``,
    `📍 Delivering to: ${order.addressLine || order.deliveryAddress}, ${order.city}`,
    ``,
    `We'll notify you when your order is out for delivery. Thank you! 🙏`,
  ].join('\n');

  await sendText(phone, message);
}

/**
 * Notify customer when order status changes.
 */
export async function notifyStatusUpdate(order: any, newStatus: string): Promise<void> {
  const phone = order.phoneNumber || order.customerPhone;
  if (!phone) return;

  const orderNumber = order.orderNumber || order.id?.slice(-8).toUpperCase();

  const statusMessages: Record<string, string> = {
    confirmed: `✅ Your order *${orderNumber}* has been confirmed and is being prepared.`,
    processing: `⚙️ Your order *${orderNumber}* is now being processed.`,
    shipped: `🚚 Your order *${orderNumber}* is on its way! Expect delivery soon.`,
    ontheway: `🚚 Your order *${orderNumber}* is out for delivery!`,
    delivered: `🎉 Your order *${orderNumber}* has been delivered. Enjoy!`,
    cancelled: `❌ Your order *${orderNumber}* has been cancelled. Contact us if this is a mistake.`,
  };

  const text = statusMessages[newStatus];
  if (!text) return;

  await sendText(phone, `*Brothers Sports House*\n\n${text}`);
}

/**
 * Notify delivery boy when assigned to an order.
 */
export async function notifyDeliveryBoyAssigned(
  deliveryBoyPhone: string,
  deliveryBoyName: string,
  order: any
): Promise<void> {
  const orderNumber = order.orderNumber || order.id?.slice(-8).toUpperCase();

  const message = [
    `📦 *New Delivery Assignment — Brothers Sports House*`,
    ``,
    `Hi ${deliveryBoyName}! You have a new order to deliver.`,
    ``,
    `📋 Order: *${orderNumber}*`,
    `👤 Customer: ${order.firstName} ${order.lastName}`,
    `📱 Phone: ${order.phoneNumber}`,
    `📍 Address: ${order.addressLine}, ${order.city}`,
    `💵 Total: Rs.${order.totalPrice} (COD)`,
    ``,
    `Please confirm pickup when you collect the package.`,
  ].join('\n');

  await sendText(deliveryBoyPhone, message);
}

export const whatsappService = {
  sendText,
  generateWhatsAppUrl,
  notifyOrderPlaced,
  notifyStatusUpdate,
  notifyDeliveryBoyAssigned,
};
