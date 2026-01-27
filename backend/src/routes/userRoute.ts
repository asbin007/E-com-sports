import { Router } from "express";
import userController from "../controllers/userController.js";
import userMiddleware from "../middleware/userMiddleware.js";
import { Role } from "../middleware/userMiddleware.js";

const router = Router();

// User profile routes (authenticated)
router.get("/profile", userMiddleware.isUserLoggedIn, userController.getProfile);
router.put("/profile", userMiddleware.isUserLoggedIn, userController.updateProfile);
router.put("/change-password", userMiddleware.isUserLoggedIn, userController.changePassword);

// Admin routes
router.get(
  "/",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  userController.getAllUsers
);

router.get(
  "/:id",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  userController.getUserById
);

router.put(
  "/:id/role",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  userController.updateUserRole
);

router.put(
  "/:id/status",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  userController.toggleUserStatus
);

router.delete(
  "/:id",
  userMiddleware.isUserLoggedIn,
  userMiddleware.accessTo(Role.Admin),
  userController.deleteUser
);

export default router;
