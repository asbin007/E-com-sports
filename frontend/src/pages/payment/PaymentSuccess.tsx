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
      const orderId = searchParams.get("orderId");
      if (!pidx) {
        setStatus("failed");
        return;
      }

      try {
        await api.post("/payments/khalti/verify", { pidx, orderId });
        setStatus("success");
        setTimeout(() => navigate("/"), 3000); // Redirect to home after 3s
      } catch (error) {
        console.error("Payment verification failed:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [pidx, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl max-w-sm w-full text-center"
      >
        {status === "verifying" && (
          <>
            <Loader className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tighter">
              Verifying Payment
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
              Executing Transaction Protocol...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tighter">
              Transaction Approved
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Gear deployment initiated.</p>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-6 bg-orange-50 py-2 px-4 rounded-xl inline-block">
              Redirecting Command...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-stone-950 uppercase italic tracking-tighter">Protocol Failed</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
              Transaction rejected. Please verify your credentials.
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-8 w-full bg-stone-950 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-stone-950/10"
            >
              Re-initiate Payment
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
