import axios from "axios";
import { envConfig } from "../../config/config.js";

interface KhaltiInitiateRequest {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
}

interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
}

interface KhaltiVerifyRequest {
  pidx: string;
}

interface KhaltiVerifyResponse {
  pidx: string;
  total_amount: number;
  status: string;
  transaction_id: string;
  fee: number;
  refunded: boolean;
}

class KhaltiService {
  private baseUrl = "https://a.khalti.com/api/v2";
  private publicKey: string;
  private secretKey: string;
  private returnUrl: string;

  constructor() {
    this.publicKey = envConfig.khaltiPublicKey || "";
    this.secretKey = envConfig.khaltiSecretKey || "";
    this.returnUrl = envConfig.khaltiReturnUrl || "http://localhost:5173/payment/success";
  }

  async initiatePayment(
    amount: number,
    purchaseOrderId: string,
    purchaseOrderName: string,
    customerInfo: { name: string; email: string; phone: string }
  ): Promise<KhaltiInitiateResponse> {
    try {
      const payload: KhaltiInitiateRequest = {
        return_url: this.returnUrl,
        website_url: this.returnUrl,
        amount: amount * 100, // Convert to paisa
        purchase_order_id: purchaseOrderId,
        purchase_order_name: purchaseOrderName,
        customer_info: customerInfo,
      };

      const response = await axios.post(
        `${this.baseUrl}/epayment/initiate/`,
        payload,
        {
          headers: {
            Authorization: `Key ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Khalti initiate payment error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.detail || "Failed to initiate Khalti payment"
      );
    }
  }

  async verifyPayment(pidx: string): Promise<KhaltiVerifyResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/epayment/lookup/`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Khalti verify payment error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.detail || "Failed to verify Khalti payment"
      );
    }
  }
}

export default new KhaltiService();

