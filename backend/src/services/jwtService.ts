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
      console.error("CRITICAL: jwtSecret is missing in JwtService!");
    }
    return jwt.sign(payload, envConfig.jwtSecret as string, {
      expiresIn: envConfig.jwtExpiration || "24h",
    });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, envConfig.jwtSecret as string, {
      expiresIn: "7d",
    });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(
      token,
      envConfig.jwtSecret as string
    ) as TokenPayload;
  }
}

export default new JwtService();

