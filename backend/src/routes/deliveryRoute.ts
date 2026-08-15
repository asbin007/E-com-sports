import { Router } from "express";
import deliveryController from "../controllers/deliveryController.js";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

// All delivery routes require authentication + delivery or admin role
router.use(userMiddleware.isUserLoggedIn);
router.use(userMiddleware.accessTo(Role.Delivery, Role.Admin));

// Get orders assigned to delivery (active orders)
router.get("/orders", errorHandler(deliveryController.getDeliveryOrders.bind(deliveryController)));

// Update order status (delivery boy can only move forward: preparation → ontheway → delivered)
router.patch("/orders/:id/status", errorHandler(deliveryController.updateDeliveryStatus.bind(deliveryController)));

export default router;
