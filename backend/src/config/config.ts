import { config } from 'dotenv';
import path from 'path';

console.log("Config: Current working directory:", process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log("Config: Loading .env from:", envPath);
const result = config({ path: envPath });
if (result.error) {
    console.error("Config: Error loading .env file:", result.error);
}

console.log("Config: Loaded keys:", Object.keys(process.env).filter(k => k.startsWith('JWT') || k.startsWith('jwt')));
if (result.parsed) {
    console.log("Config: Parsed keys from .env:", Object.keys(result.parsed));
}

if (!process.env.JWT_SECRET_KEY) {
    console.error("CRITICAL ERROR: JWT_SECRET_KEY is missing/undefined!");
} else {
    console.log("Config: JWT_SECRET_KEY loaded.");
}

export const envConfig = {
    port: process.env.PORT,
    databaseUrl: process.env.DB_URL,
    jwtSecret: process.env.JWT_SECRET_KEY,
    jwtExpiration: process.env.JWT_EXPIRE_IN || '24h',
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    admin: process.env.ADMIN_EMAIL,
    passwordAdmin: process.env.ADMIN_PASSWORD,
    admin_username: process.env.ADMIN_USERNAME,
    adminSecretKey: process.env.ADMIN_SECRET_KEY,
    
    // Cloudinary
    cloudinaryUrl: process.env.CLOUDINARY_URL,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudApiKey: process.env.CLOUDINARY_API_KEY,
    cloudApiSecret: process.env.CLOUDINARY_API_SECRET,
    
    // Payment
    khaltiSecretKey: process.env.KHALTI_SECRET_KEY,
    
    resendApiKey: process.env.RESEND_API,
    khaltiPublicKey: process.env.KHALTI_PUBLIC_KEY,
    khaltiReturnUrl: process.env.KHALTI_RETURN_URL,
    
    // Client
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:1000',
}
