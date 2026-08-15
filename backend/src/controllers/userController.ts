import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import User from "../database/models/userModel.js";
import Address from "../database/models/addressModel.js";
import Order from "../database/models/orderModel.js";

class UserController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password", "otp", "otpGeneratedTime"] },
        include: [
          {
            model: Address,
            attributes: ["id", "addressLine", "city", "state", "zipcode", "isDefault"],
          },
        ],
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        message: "Profile fetched successfully",
        data: user,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username, phoneNumber, avatar } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await user.update({
        username: username || user.username,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
        avatar: avatar !== undefined ? avatar : user.avatar,
      });

      res.status(200).json({
        message: "Profile updated successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters" });
        return;
      }

      const user = await User.findByPk(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Admin: Get all users
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { role, search, page = 1, limit = 20, isActive } = req.query;

      const where: any = {};

      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === "true";
      if (search) {
        where.username = { [Op.iLike]: `%${search}%` };
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: { exclude: ["password", "otp", "otpGeneratedTime"] },
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Users fetched successfully",
        data: users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Admin: Get user by ID
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password", "otp", "otpGeneratedTime"] },
        include: [
          {
            model: Address,
          },
          {
            model: Order,
            limit: 10,
            order: [["createdAt", "DESC"]],
          },
        ],
      });

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        message: "User fetched successfully",
        data: user,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Admin: Update user role
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { role } = req.body;

      if (!role || !["customer", "admin"].includes(role)) {
        res.status(400).json({ message: "Valid role is required (customer or admin)" });
        return;
      }

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await user.update({ role });

      res.status(200).json({
        message: "User role updated successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Admin: Toggle user active status
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await user.update({ isActive: !user.isActive });

      res.status(200).json({
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        data: {
          id: user.id,
          username: user.username,
          isActive: user.isActive,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Admin: Delete user
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Soft delete - just deactivate
      await user.update({ isActive: false });

      res.status(200).json({
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new UserController();
