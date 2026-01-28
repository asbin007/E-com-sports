import express from "express";
import cors from "cors";
import passport from "./config/passport.js";
import "./database/connection/connection.js";
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
import userRoute from "./routes/userRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:2000",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.includes("vercel.app") ||
      origin.includes("localhost")
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-auth-token",
    "Access-Control-Allow-Origin",
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.use(passport.initialize());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      origin.includes("vercel.app") ||
      origin.includes("localhost"))
  ) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
  } else {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Brothers Shoe Backend is running successfully!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
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
    message: "Welcome to Brothers Shoe Backend API!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/api/health",
      auth: "/api/v1/auth",
      products: "/api/v1/products",
      categories: "/api/v1/categories",
      brands: "/api/v1/brands",
      productTypes: "/api/v1/product-types",
      cart: "/api/v1/cart",
      orders: "/api/v1/orders",
      payments: "/api/v1/payments",
      admin: "/api/v1/admin",
      reviews: "/api/v1/reviews",
      wishlist: "/api/v1/wishlist",
      collections: "/api/v1/collections",
      recommendations: "/api/v1/recommendations",
      users: "/api/v1/users",
      dashboard: "/api/v1/dashboard",
    },
  });
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/brands", brandRoute);
app.use("/api/v1/product-types", productTypeRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/payments", paymentRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/wishlist", wishlistRoute);
app.use("/api/v1/collections", collectionRoute);
app.use("/api/v1/recommendations", recommendationRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
