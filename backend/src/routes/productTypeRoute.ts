import { Router } from "express";
import productTypeController from "../controllers/productTypeController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.get("/", errorHandler(productTypeController.getProductTypes.bind(productTypeController)));
router.post("/", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(productTypeController.addProductType.bind(productTypeController)));
router.put("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(productTypeController.updateProductType.bind(productTypeController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(productTypeController.deleteProductType.bind(productTypeController)));

export default router;
