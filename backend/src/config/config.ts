import { config } from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

export const envConfig = {
    port: process.env.PORT,
    databaseUrl: process.env.DB_URL,
    jwtSecret: process.env.JWT_SECRET_KEY,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY,
    jwtExpiration: process.env.JWT_EXPIRE_IN || '15m',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRE_IN || '7d',
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
    
    // Payment (unused - manual QR verification)
    
    resendApiKey: process.env.RESEND_API,
    
    // Client
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:1000',
        
    // WhatsApp
    whatsappNumber: process.env.WHATSAPP_NUMBER || '9779817801199',
}
