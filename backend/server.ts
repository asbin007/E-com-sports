import http from "http";
import { envConfig } from "./src/config/config.js";
import app from "./src/app.js";
import sequelize, { connectDB } from "./src/database/connection/connection.js";
import { seedAdmin } from "./src/database/seeders/adminSeeder.js";
import { seedAll } from "./src/database/seeders/seedAll.js";

// ── Validate critical environment variables at startup ──
function validateEnv() {
  const required = [
    { key: "DB_URL", value: envConfig.databaseUrl },
    { key: "JWT_SECRET_KEY", value: envConfig.jwtSecret },
  ];

  const missing = required.filter((r) => !r.value);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((m) => console.error(`   - ${m.key}`));
    console.error("\nPlease set these in your .env file.");
    process.exit(1);
  }
}

function startServer() {
  validateEnv();

  const host = process.env.HOST || "0.0.0.0";
  const port = envConfig.port || 1000;

  try {
    console.log("Starting server...");
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${port}`);

    const server = http.createServer(app);

    // ── Graceful shutdown ──
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log("✅ Database connections closed");
        } catch (err) {
          console.error("Error closing DB:", err);
        }
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    server.listen(Number(port), host, async () => {
      console.log(`✅ Server is running on port ${port}`);

      if (envConfig.databaseUrl) {
        try {
          await connectDB();

          if (process.env.NODE_ENV !== "production") {
            await sequelize.sync({ force: false, alter: false });
            console.log("✅ Database synchronized");

            await seedAdmin();
            await seedAll();
          } else {
            console.log("⚠️ Skipping database sync in production");
          }
        } catch (error: any) {
          console.error("Error syncing database:", error);

          if (
            error.name === "SequelizeUniqueConstraintError" ||
            (error.parent && error.parent.code === "23505")
          ) {
            console.log("⚠️ Database tables already exist, continuing...");
          } else {
            if (process.env.NODE_ENV === "production") {
              console.log("Continuing without database sync in production...");
            } else {
              throw error;
            }
          }
        }
      } else {
        console.log("⚠️ No DB_URL — running without database");
      }
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();

export default startServer;
