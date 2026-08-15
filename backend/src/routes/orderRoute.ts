import { Router } from "express";
import orderController from "../controllers/orderController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

// Customer routes (require auth)
router.post("/", userMiddleware.isUserLoggedIn, errorHandler(orderController.createOrder.bind(orderController)));
router.get("/", userMiddleware.isUserLoggedIn, errorHandler(orderController.getOrders.bind(orderController)));
router.get("/export", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(orderController.exportOrders.bind(orderController)));
router.get("/:id", userMiddleware.isUserLoggedIn, errorHandler(orderController.getOrderById.bind(orderController)));
router.put("/:id/cancel", userMiddleware.isUserLoggedIn, errorHandler(orderController.cancelOrder.bind(orderController)));

// Admin routes
router.patch("/:id/status", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(orderController.updateOrderStatus.bind(orderController)));
router.patch("/:id/assign", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(orderController.assignDeliveryBoy.bind(orderController)));

export default router;
