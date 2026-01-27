import { Router } from "express";
import recommendationController from "../controllers/recommendationController.js";
import userMiddleware from "../middleware/userMiddleware.js";

const router = Router();

// All recommendation routes are public (personalized ones check auth internally)

// Get trending products
router.get("/trending", recommendationController.getTrendingProducts);

// Get new arrivals
router.get("/new-arrivals", recommendationController.getNewArrivals);

// Get best sellers
router.get("/best-sellers", recommendationController.getBestSellers);

// Get on sale products
router.get("/on-sale", recommendationController.getOnSaleProducts);

// Get all collections in one call
router.get("/all-collections", recommendationController.getAllCollections);

// Get personalized recommendations (works for both logged in and anonymous users)
router.get(
  "/personalized",
  // Optional auth - controller handles both cases
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      userMiddleware.isUserLoggedIn(req, res, next);
    } else {
      next();
    }
  },
  recommendationController.getPersonalizedRecommendations
);

export default router;
