import { Router } from "express";
import adminController from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.post("/variants", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.createVariant.bind(adminController)));
router.put("/variants/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateVariant.bind(adminController)));
router.delete("/variants/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.deleteVariant.bind(adminController)));
router.put("/inventory", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateInventory.bind(adminController)));
router.get("/inventory/low-stock", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.getLowStockItems.bind(adminController)));
router.put("/orders/:id/status", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateOrderStatus.bind(adminController)));

export default router;

