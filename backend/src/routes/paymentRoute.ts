import { Router } from "express";
import paymentController from "../controllers/paymentController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";
import { upload } from "../middleware/multer.js";

const router = Router();

// Public: available payment methods for the checkout page.
// Must stay above the "/:orderId/..." routes so "methods" is not read as an orderId.
router.get(
  "/methods",
  errorHandler(paymentController.getPaymentMethods.bind(paymentController))
);

// Customer: upload payment proof (screenshot + transaction ID)
router.post(
  "/:orderId/proof",
  userMiddleware.isUserLoggedIn,
  upload.single("screenshot"),
  errorHandler(paymentController.uploadPaymentProof.bind(paymentController))
);

// Customer/Admin: check payment status of an order
router.get(
  "/:orderId/status",
  userMiddleware.isUserLoggedIn,
  errorHandler(paymentController.getPaymentStatus.bind(paymentController))
);

// Admin: verify (approve) a payment
router.patch(
  "/:orderId/verify",
  userMiddleware.isUserLoggedIn,
  requireAdmin,
  errorHandler(paymentController.verifyPayment.bind(paymentController))
);

// Admin: reject a payment
router.patch(
  "/:orderId/reject",
  userMiddleware.isUserLoggedIn,
  requireAdmin,
  errorHandler(paymentController.rejectPayment.bind(paymentController))
);

export default router;
