import { Router } from "express";
import authController from "../controllers/authController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";
import passport from "passport";

const router = Router();

router.post("/register", errorHandler(authController.register.bind(authController)));
router.post("/verify-otp", errorHandler(authController.verifyOtp.bind(authController)));
router.post("/resend-otp", errorHandler(authController.resendOtp.bind(authController)));
router.post("/login", errorHandler(authController.login.bind(authController)));
router.post("/refresh", errorHandler(authController.refresh.bind(authController)));
router.get("/me", userMiddleware.isUserLoggedIn, errorHandler(authController.me.bind(authController)));

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback.bind(authController)
);

export default router;

