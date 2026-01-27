import { Router } from "express";
import paymentController from "../controllers/paymentController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.post(
  "/khalti/initialize",
  userMiddleware.isUserLoggedIn,
  errorHandler(paymentController.initializeKhalti.bind(paymentController))
);

router.post(
  "/khalti/verify",
  userMiddleware.isUserLoggedIn,
  errorHandler(paymentController.verifyKhalti.bind(paymentController))
);

export default router;

