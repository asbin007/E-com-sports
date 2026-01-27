import { Router } from "express";
import cartController from "../controllers/cartController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";

const router = Router();

router.get("/", userMiddleware.isUserLoggedIn, errorHandler(cartController.getCart.bind(cartController)));
router.post("/", userMiddleware.isUserLoggedIn, errorHandler(cartController.addToCart.bind(cartController)));
router.put("/:id", userMiddleware.isUserLoggedIn, errorHandler(cartController.updateCart.bind(cartController)));
router.delete("/:id", userMiddleware.isUserLoggedIn, errorHandler(cartController.removeFromCart.bind(cartController)));

export default router;

