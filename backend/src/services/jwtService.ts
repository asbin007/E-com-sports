import jwt from "jsonwebtoken";
import { envConfig } from "../config/config.js";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class JwtService {
  generateAccessToken(payload: TokenPayload): string {
    if (!envConfig.jwtSecret) {
      throw new Error("CRITICAL: jwtSecret is missing!");
    }
    return jwt.sign(payload, envConfig.jwtSecret as string, {
      expiresIn: (envConfig.jwtExpiration || "15m") as any,
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.jwtRefreshSecret as string, {
      expiresIn: (envConfig.jwtRefreshExpiration || "7d") as any,
    });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(
      token,
      envConfig.jwtSecret as string
    ) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(
      token,
      envConfig.jwtRefreshSecret as string
    ) as TokenPayload;
  }
}

export default new JwtService();

