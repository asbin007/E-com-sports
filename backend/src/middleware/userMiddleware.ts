import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/config.js";
import User from "../database/models/userModel.js";

export enum Role {
  Admin = "admin",
  Customer = "customer",
  Delivery = "delivery",
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        email: string;
        role: string;
        password?: string;
        id: string;
      };
    }
    interface User {
      username: string;
      email: string;
      role: string;
      password?: string;
      id: string;
    }
  }
}

class UserMiddleware {
  async isUserLoggedIn(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

      if (!token) {
        res.status(401).json({
          message: "Token must be provided",
        });
        return;
      }

      const decoded = jwt.verify(
        token,
        envConfig.jwtSecret as string
      ) as any;

      const userData = await User.findByPk(decoded.userId);
      if (!userData) {
        res.status(404).json({
          message: "No user with that userId",
        });
        return;
      }

      req.user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };

      next();
    } catch (error: any) {
      if (error.name !== "TokenExpiredError") {
        console.error("JWT verification error:", error);
      }

      if (error.name === "JsonWebTokenError") {
        res.status(401).json({
          message: "Invalid token signature",
        });
      } else if (error.name === "TokenExpiredError") {
        res.status(401).json({
          message: "Token has expired",
        });
      } else {
        res.status(401).json({
          message: "Access denied. Invalid token.",
        });
      }
    }
  }

  accessTo(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      let userRole = req.user?.role as Role;
      if (!roles.includes(userRole)) {
        res.status(403).json({
          message: "You don't have permission",
        });
        return;
      }
      next();
    };
  }
}

export default new UserMiddleware();

