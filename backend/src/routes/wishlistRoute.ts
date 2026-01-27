import { Router } from "express";
import wishlistController from "../controllers/wishlistController.js";
import userMiddleware from "../middleware/userMiddleware.js";

const router = Router();

// All wishlist routes require authentication
router.use(userMiddleware.isUserLoggedIn);

// Get user's wishlist
router.get("/", wishlistController.getWishlist);

// Add to wishlist
router.post("/:productId", wishlistController.addToWishlist);

// Remove from wishlist
router.delete("/:productId", wishlistController.removeFromWishlist);

// Toggle wishlist (add or remove)
router.post("/toggle/:productId", wishlistController.toggleWishlist);

// Check if product is in wishlist
router.get("/check/:productId", wishlistController.checkWishlist);

export default router;
