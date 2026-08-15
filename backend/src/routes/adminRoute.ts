import { Router } from "express";
import adminController from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import userMiddleware, { Role } from "../middleware/userMiddleware.js";
import errorHandler from "../middleware/errorHandler.js";
import bcrypt from "bcrypt";
import User from "../database/models/userModel.js";

const router = Router();

router.post("/create", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.createAdmin.bind(adminController)));

// Create delivery boy account (admin only)
router.post("/create-delivery", userMiddleware.isUserLoggedIn, userMiddleware.accessTo(Role.Admin), async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: "Username, email, and password are required" });
      return;
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const deliveryUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "delivery",
      isVerified: true,
    });

    res.status(201).json({
      message: "Delivery boy account created successfully",
      data: {
        id: deliveryUser.id,
        username: deliveryUser.username,
        email: deliveryUser.email,
        role: deliveryUser.role,
      },
    });
  } catch (error: any) {
    console.error("Create delivery boy error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all delivery boys (admin only)
router.get("/delivery-boys", userMiddleware.isUserLoggedIn, userMiddleware.accessTo(Role.Admin), async (req, res) => {
  try {
    const deliveryBoys = await User.findAll({
      where: { role: "delivery" },
      attributes: ["id", "username", "email", "isVerified", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Delivery boys fetched",
      data: deliveryBoys,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete delivery boy (admin only)
router.delete("/delivery-boys/:id", userMiddleware.isUserLoggedIn, userMiddleware.accessTo(Role.Admin), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, role: "delivery" } });
    if (!user) {
      res.status(404).json({ message: "Delivery boy not found" });
      return;
    }
    await user.destroy();
    res.status(200).json({ message: "Delivery boy deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/variants", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.createVariant.bind(adminController)));
router.put("/variants/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateVariant.bind(adminController)));
router.delete("/variants/:id", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.deleteVariant.bind(adminController)));
router.put("/inventory", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateInventory.bind(adminController)));
router.get("/inventory/low-stock", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.getLowStockItems.bind(adminController)));
router.put("/orders/:id/status", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.updateOrderStatus.bind(adminController)));
router.get("/reviews", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.getAllReviews.bind(adminController)));
router.put("/reviews/:id/visibility", userMiddleware.isUserLoggedIn, requireAdmin, errorHandler(adminController.toggleReviewVisibility.bind(adminController)));

export default router;

