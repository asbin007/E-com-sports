import { Router } from "express";
import dashboardController from "../controllers/dashboardController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { Role } from "../middleware/userMiddleware.js";

const router = Router();

// All dashboard routes require admin authentication
router.use(userMiddleware.isUserLoggedIn);
router.use(userMiddleware.accessTo(Role.Admin));

// Get overall stats
router.get("/stats", dashboardController.getStats);

// Get revenue chart data
router.get("/revenue-chart", dashboardController.getRevenueChart);

// Get top selling products
router.get("/top-products", dashboardController.getTopProducts);

// Get recent orders
router.get("/recent-orders", dashboardController.getRecentOrders);

// Get orders by status
router.get("/orders-by-status", dashboardController.getOrdersByStatus);

// Get sales by category
router.get("/sales-by-category", dashboardController.getSalesByCategory);

export default router;
