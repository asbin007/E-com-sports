import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying",
  );
  const pidx = searchParams.get("pidx");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!pidx) {
        setStatus("failed");
        return;
      }

      try {
        await api.post("/payments/khalti/verify", { pidx });
        setStatus("success");
        setTimeout(() => navigate("/"), 3000); // Redirect to home after 3s
      } catch (error) {
        console.error("Payment verification failed:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [pidx, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center"
      >
        {status === "verifying" && (
          <>
            <Loader className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">
              Verifying Payment...
            </h2>
            <p className="text-gray-500 mt-2">
              Please wait while we confirm your transaction.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Payment Successful!
            </h2>
            <p className="text-gray-500 mt-2">Your order has been confirmed.</p>
            <p className="text-sm text-gray-400 mt-4">
              Redirecting you home...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment Failed</h2>
            <p className="text-gray-500 mt-2">
              We couldn't verify your payment. Please contact support.
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
