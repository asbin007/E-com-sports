import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../database/models/userModel.js";
import { sendOtp as sendResendOtp } from "../services/resendMail.js";
import jwtService from "../services/jwtService.js";

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body || {};

      if (!username || !email || !password) {
        res.status(400).json({
          message: "Fill all the fields",
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: "User already exists",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 6);
      const otpExpiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpiration,
        isVerified: false,
      });

      try {
        await sendResendOtp(email, otp);

        res.status(201).json({
          message: "User registered successfully. Please check your email for OTP.",
          userId: newUser.id,
          email: newUser.email,
          

          requiresOtp: true,
        });
      } catch (emailError) {
        console.error("Resend delivery failed:", emailError);
        res.status(201).json({
          message: "User registered successfully. Verification email may be delayed.",
          userId: newUser.id,
          email: newUser.email,
          requiresOtp: true,
        });
      }
    } catch (error: any) {
      console.error("Critical Registration Failure:");
      console.error("- Message:", error.message);
      console.error("- Stack:", error.stack);
      if (error.parent) console.error("- DB Error Details:", error.parent.detail || error.parent);
      
      res.status(500).json({
        message: "Internal server error during registration",
      });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body || {};

      if (!email || !otp) {
        res.status(400).json({
          message: "Email and OTP are required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          message: "User already verified",
        });
        return;
      }

      const isValidOtp = user.otp ? await bcrypt.compare(otp, user.otp) : false;
      if (!isValidOtp || (user.otpExpiration && user.otpExpiration < new Date())) {
        res.status(400).json({
          message: "Invalid or expired OTP",
        });
        return;
      }

      await user.update({ isVerified: true, otp: null as any, otpExpiration: null as any });

      const token = jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "OTP verified successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: true,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body || {};

      if (!email) {
        res.status(400).json({
          message: "Email is required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          message: "User already verified",
        });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 6);
      const otpExpiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await user.update({ otp: hashedOtp, otpExpiration });

      try {
        await sendResendOtp(email, otp);
        res.status(200).json({
          message: "OTP resent successfully",
        });
      } catch (emailError) {
        console.error("Resend delivery failed:", emailError);
        res.status(500).json({
          message: "Failed to send OTP email",
        });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          message: "Invalid email or password",
        });
        return;
      }

      if (!user.isVerified) {
        res.status(400).json({
          message: "Please verify your email first",
        });
        return;
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        res.status(423).json({
          message: "Account locked. Try again later.",
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

        if (failedLoginAttempts >= 5) {
          await user.update({
            failedLoginAttempts: 0,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          });
          res.status(423).json({
            message: "Account locked. Try again later.",
          });
          return;
        }

        await user.update({ failedLoginAttempts });
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      await user.update({ failedLoginAttempts: 0, lockedUntil: null as any });

      const token = jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = jwtService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        message: "Login successful",
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body || {};

      if (!refreshToken) {
        res.status(400).json({
          message: "Refresh token is required",
        });
        return;
      }

      try {
        const decoded = jwtService.verifyRefreshToken(refreshToken);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
          res.status(404).json({
            message: "User not found",
          });
          return;
        }

        const newToken = jwtService.generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        res.status(200).json({
          message: "Token refreshed successfully",
          token: newToken,
        });
      } catch (error: any) {
        res.status(401).json({
          message: "Invalid refresh token",
        });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;

      if (!user) {
        res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=auth_failed`);
        return;
      }

      const token = jwtService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      const refreshToken = jwtService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=auth_failed`);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password", "otp", "otpGeneratedTime"] },
      });

      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new AuthController();

