import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/config.js";
import User from "../database/models/userModel.js";

export enum Role {
  Admin = "admin",
  Customer = "customer",
  Delivery = "delivery",
}

export const requireRole = (allowedRoles: Role[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        res.status(401).json({
          message: "Access denied. No token provided.",
        });
        return;
      }

      const decoded = jwt.verify(
        token,
        envConfig.jwtSecret as string
      ) as any;

      const user = await User.findByPk(decoded.userId);

      if (!user) {
        res.status(401).json({
          message: "Access denied. User not found.",
        });
        return;
      }

      if (!allowedRoles.includes(user.role as Role)) {
        res.status(403).json({
          message: `Access denied. Required roles: ${allowedRoles.join(
            ", "
          )}. Your role: ${user.role}`,
        });
        return;
      }

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(401).json({
        message: "Access denied. Invalid token.",
      });
    }
  };
};

export const requireCustomer = requireRole([Role.Customer]);
export const requireAdmin = requireRole([Role.Admin]);
export const requireDelivery = requireRole([Role.Delivery]);
