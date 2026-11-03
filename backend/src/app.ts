import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import passport from "./config/passport.js";
import "./database/connection/connection.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { sanitizeInput } from "./middleware/validation.js";
import authRoute from "./routes/authRoute.js";
import categoryRoute from "./routes/categoryRoute.js";
import brandRoute from "./routes/brandRoute.js";
import productTypeRoute from "./routes/productTypeRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";
import paymentRoute from "./routes/paymentRoute.js";
import adminRoute from "./routes/adminRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import wishlistRoute from "./routes/wishlistRoute.js";
import collectionRoute from "./routes/collectionRoute.js";
import recommendationRoute from "./routes/recommendationRoute.js";
import deliveryRoute from "./routes/deliveryRoute.js";
import userRoute from "./routes/userRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import sportRoute from "./routes/sportRoute.js";

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP — managed by frontend/reverse proxy in production
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeInput);

const allowedOrigins = [
  "http://localhost:5173",  // Frontend
  "http://localhost:2000",  // Frontend alternate
  "http://localhost:3000",  // Admin panel
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.ADMIN_URL) {
  allowedOrigins.push(process.env.ADMIN_URL);
}

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-auth-token",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(passport.initialize());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Brothers Sports House Backend is running successfully!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/api/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Brothers Sports House Backend API",
    version: "1.0.0",
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/categories", rateLimiter, categoryRoute);
app.use("/api/v1/brands", rateLimiter, brandRoute);
app.use("/api/v1/product-types", rateLimiter, productTypeRoute);
app.use("/api/v1/products", rateLimiter, productRoute);
app.use("/api/v1/cart", rateLimiter, cartRoute);
app.use("/api/v1/orders", rateLimiter, orderRoute);
app.use("/api/v1/payments", rateLimiter, paymentRoute);
app.use("/api/v1/admin", rateLimiter, adminRoute);
app.use("/api/v1/reviews", rateLimiter, reviewRoute);
app.use("/api/v1/wishlist", rateLimiter, wishlistRoute);
app.use("/api/v1/collections", rateLimiter, collectionRoute);
app.use("/api/v1/recommendations", rateLimiter, recommendationRoute);
app.use("/api/v1/users", rateLimiter, userRoute);
app.use("/api/v1/delivery", rateLimiter, deliveryRoute);
app.use("/api/v1/dashboard", rateLimiter, dashboardRoute);
app.use("/api/v1/sports", rateLimiter, sportRoute);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : (err.message || "Internal server error"),
    ...(process.env.NODE_ENV === "development" && { error: err.message, stack: err.stack }),
  });
});

export default app;
