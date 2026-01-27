import http from "http";
import { envConfig } from "./config/config.js";
import app from "./src/app.js";
import sequelize, { connectDB } from "./src/database/connection/connection.js";

function startServer() {
  const host = process.env.HOST || "0.0.0.0";
  const port = envConfig.port || 1001;

  try {
    console.log("Starting server...");
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${port}`);

    const server = http.createServer(app);

    server.listen(Number(port), host, async () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

      if (envConfig.databaseUrl) {
        try {
          await connectDB();

          if (process.env.NODE_ENV !== "production") {
            await sequelize.sync({ force: false, alter: true });
            console.log("✅ Database synchronized successfully (alter enabled)");
          } else {
            console.log("⚠️  Skipping database sync in production");
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
        console.log("Skipping database sync - no database connection");
      }
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();

export default startServer;
