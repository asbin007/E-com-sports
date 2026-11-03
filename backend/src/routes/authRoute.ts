import { Router } from "express";
import authController from "../controllers/authController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import passport from "passport";

const router = Router();

// Credential / OTP endpoints get the strict per-IP limiter. /me and /refresh
// are hit on every page load, so they only get the general limiter from app.ts.
router.post("/register", authRateLimiter, errorHandler(authController.register.bind(authController)));
router.post("/verify-otp", authRateLimiter, errorHandler(authController.verifyOtp.bind(authController)));
router.post("/resend-otp", authRateLimiter, errorHandler(authController.resendOtp.bind(authController)));
router.post("/login", authRateLimiter, errorHandler(authController.login.bind(authController)));
router.post("/exchange", authRateLimiter, errorHandler(authController.exchangeCode.bind(authController)));
router.post("/refresh", errorHandler(authController.refresh.bind(authController)));
router.get("/me", userMiddleware.isUserLoggedIn, errorHandler(authController.me.bind(authController)));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback.bind(authController)
);

export default router;

