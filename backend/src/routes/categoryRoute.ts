import { Router } from "express";
import categoryController from "../controllers/categoryController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.get("/", errorHandler(categoryController.getAllCategories.bind(categoryController)));
router.get("/:id", errorHandler(categoryController.getCategoryById.bind(categoryController)));
router.post("/", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(categoryController.createCategory.bind(categoryController)));
router.put("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(categoryController.updateCategory.bind(categoryController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(categoryController.deleteCategory.bind(categoryController)));

export default router;

