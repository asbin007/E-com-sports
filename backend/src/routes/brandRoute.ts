import { Router } from "express";
import brandController from "../controllers/brandController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.get("/", errorHandler(brandController.getAllBrands.bind(brandController)));
router.get("/:id", errorHandler(brandController.getBrandById.bind(brandController)));
router.post("/", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(brandController.createBrand.bind(brandController)));
router.put("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(brandController.updateBrand.bind(brandController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(brandController.deleteBrand.bind(brandController)));

export default router;

