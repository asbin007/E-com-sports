import { Router } from "express";
import productController from "../controllers/productController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.get("/", errorHandler(productController.getAllProducts.bind(productController)));
router.get("/:id", errorHandler(productController.getProductById.bind(productController)));
router.post("/", userMiddleware.isUserLoggedIn, requireAdmin, upload.array("images", 10), errorHandler(productController.createProduct.bind(productController)));
router.put("/:id", userMiddleware.isUserLoggedIn, requireAdmin, upload.array("images", 10), errorHandler(productController.updateProduct.bind(productController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(productController.deleteProduct.bind(productController)));

export default router;

