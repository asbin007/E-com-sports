import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import api from "../../services/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying",
  );
  const pidx = searchParams.get("pidx");
  const reduce = useReducedMotion();

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
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
        className="w-full max-w-sm rounded-card border-2 border-inverse bg-card p-8 text-center"
      >
        {status === "verifying" && (
          <>
            <Loader className="mx-auto mb-6 h-16 w-16 animate-spin text-sale" aria-hidden="true" />
            <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
              Checking your payment
            </h1>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-sale">
              Please wait, do not close this page
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-tag border-2 border-pitch bg-card">
              <CheckCircle className="h-10 w-10 text-pitch" aria-hidden="true" />
            </div>
            <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
              Payment received
            </h1>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-pitch">
              Your order is on its way
            </p>
            <p className="mt-6 inline-block rounded-tag border-2 border-inverse bg-sale-soft px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              Taking you back to the shop
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-tag border-2 border-accent bg-card">
              <XCircle className="h-10 w-10 text-accent" aria-hidden="true" />
            </div>
            <h1 className="font-display text-[29px] font-semibold uppercase leading-none text-primary">
              Payment not confirmed
            </h1>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
              We could not verify this payment. Nothing was charged by us.
            </p>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-8 flex w-full items-center justify-center rounded-tag border-2 border-inverse bg-accent py-3 font-display text-xl uppercase leading-none tracking-[0.04em] text-inverse transition-all duration-snap ease-snap hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-hard active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              Back to Checkout
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
