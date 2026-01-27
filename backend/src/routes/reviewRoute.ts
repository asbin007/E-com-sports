import { Router } from "express";
import reviewController from "../controllers/reviewController.js";
import userMiddleware from "../middleware/userMiddleware.js";

const router = Router();

// Create review (authenticated)
router.post("/", userMiddleware.isUserLoggedIn, reviewController.createReview);

// Get reviews for a product (public)
router.get("/product/:productId", reviewController.getProductReviews);

// Get my reviews (authenticated)
router.get("/me", userMiddleware.isUserLoggedIn, reviewController.getMyReviews);

// Update review (authenticated, owner only)
router.put("/:id", userMiddleware.isUserLoggedIn, reviewController.updateReview);

// Delete review (authenticated, owner only)
router.delete("/:id", userMiddleware.isUserLoggedIn, reviewController.deleteReview);

export default router;
