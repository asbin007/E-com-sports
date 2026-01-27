import { config } from "dotenv";
config();

export const envConfig = {
  port: process.env.PORT,
  databaseUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRETE_KEY,
  jwtExpiration: process.env.JWT_EXPIRE_IN || "24h",
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
  cloudinaryUrl: process.env.CLOUDINARY_URL,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudApiKey: process.env.CLOUDINARY_API_KEY,
  cloudApiSecret: process.env.CLOUDINARY_API_SECRET,
  resendApiKey: process.env.RESEND_API,
  gmailEmail:process.env.EMAIL,
  gmailPassword:process.env.PASSWORD,
  client_id:process.env.CLIENT_ID,
  client_secret:process.env.CLIENT_SECRET_KEY,
};

// Validate required environment variables
const requiredEnvVars = ["DB_URL", "JWT_SECRETE_KEY"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
}