import "./config.js";
import { PaymentMethod } from "../services/types.js";

/**
 * Shape of a single customer-facing payment method in the checkout catalog.
 * Everything here is safe to send to the browser.
 */
export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  type: "qr" | "bank" | "cod";
  qrImage: string | null;
  accountName: string | null;
  accountNumber: string | null;
  bankName?: string | null;
  branch?: string | null;
  instructions: string;
  requiresProof: boolean;
  enabled: boolean;
}

// Env flags default to enabled - set the var to "false" to switch a method off.
const isEnabled = (value: string | undefined): boolean => value !== "false";

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: PaymentMethod.Esewa,
    label: "eSewa",
    type: "qr",
    qrImage: process.env.ESEWA_QR_URL || null,
    accountName: process.env.ESEWA_ACCOUNT_NAME || "Sports Store",
    accountNumber: process.env.ESEWA_ACCOUNT_NUMBER || "9800000000",
    instructions:
      "Scan the eSewa QR with your eSewa app, pay the exact order total, then upload the payment screenshot and transaction ID.",
    requiresProof: true,
    enabled: isEnabled(process.env.ESEWA_ENABLED),
  },
  {
    id: PaymentMethod.Khalti,
    label: "Khalti",
    type: "qr",
    qrImage: process.env.KHALTI_QR_URL || null,
    accountName: process.env.KHALTI_ACCOUNT_NAME || "Sports Store",
    accountNumber: process.env.KHALTI_ACCOUNT_NUMBER || "9800000000",
    instructions:
      "Scan the Khalti QR with your Khalti app, pay the exact order total, then upload the payment screenshot and transaction ID.",
    requiresProof: true,
    enabled: isEnabled(process.env.KHALTI_ENABLED),
  },
  {
    id: PaymentMethod.Bank,
    label: "Bank Transfer",
    type: "bank",
    qrImage: null,
    accountName: process.env.BANK_ACCOUNT_NAME || "Sports Store Pvt. Ltd.",
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0000000000000000",
    bankName: process.env.BANK_NAME || "Nepal Bank Ltd.",
    branch: process.env.BANK_BRANCH || "Kathmandu",
    instructions:
      "Transfer the exact order total to the account above from your bank app or branch, then upload the deposit slip and transaction ID.",
    requiresProof: true,
    enabled: isEnabled(process.env.BANK_ENABLED),
  },
  {
    id: PaymentMethod.COD,
    label: "Cash on Delivery",
    type: "cod",
    qrImage: null,
    accountName: null,
    accountNumber: null,
    instructions:
      "Pay the delivery rider in cash when your order arrives. Please keep the exact amount ready.",
    requiresProof: false,
    enabled: isEnabled(process.env.COD_ENABLED),
  },
];

/**
 * Only the methods currently switched on - this is what checkout renders.
 */
export const getEnabledPaymentMethods = (): PaymentMethodConfig[] =>
  paymentMethods.filter((method) => method.enabled);

/**
 * Look up a single method by its id, regardless of whether it is enabled.
 */
export const getPaymentMethodById = (
  id: string
): PaymentMethodConfig | undefined =>
  paymentMethods.find((method) => method.id === id);
