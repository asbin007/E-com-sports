import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { envConfig } from "../config/config.js";

// Validate required Cloudinary environment variables
if (!envConfig.cloudName || !envConfig.cloudApiKey || !envConfig.cloudApiSecret) {
  throw new Error("Missing required Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET");
}

cloudinary.config({
  cloud_name: envConfig.cloudName,
  api_key: envConfig.cloudApiKey,
  api_secret: envConfig.cloudApiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "brothers-shoe",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif", "gif"],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10, // Max 10 files per request
  },
});

export { upload };

