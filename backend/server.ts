import http from "http";
import { envConfig } from "./src/config/config.js";
import app from "./src/app.js";
import sequelize, { connectDB } from "./src/database/connection/connection.js";
import { seedAdmin } from "./src/database/seeders/adminSeeder.js";
import categoryController from "./src/controllers/categoryController.js";
import brandController from "./src/controllers/brandController.js";
import productTypeController from "./src/controllers/productTypeController.js";

async function ensureBrandNameColumn(): Promise<void> {
  // Your `Brand` model expects `brands.name`, but some existing DBs only have
  // `brands.slug`. Add `name` (nullable first), backfill from `slug`, then
  // enforce NOT NULL + uniqueness.
  await sequelize.query(`
    ALTER TABLE "brands"
    ADD COLUMN IF NOT EXISTS "name" VARCHAR(255);
  `);

  await sequelize.query(`
    UPDATE "brands"
    SET "name" = "slug"
    WHERE "name" IS NULL;
  `);

  await sequelize.query(`
    ALTER TABLE "brands"
    ALTER COLUMN "name" SET NOT NULL;
  `);

  await sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_uidx"
    ON "brands" ("name");
  `);
}

function startServer() {
  const host = process.env.HOST || "0.0.0.0";
  const port = envConfig.port || 1000;

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
            await ensureBrandNameColumn();
            // Keep sync minimal to avoid long/locking schema-alter runs.
            await sequelize.sync({ force: false, alter: false });
            console.log(
              "✅ Database synchronized successfully (alter enabled)"
            );
            await seedAdmin();
            await seedAdmin();
            await categoryController.seedCategory();
            console.log("Categories seeded successfully");

            await brandController.seedBrand();
            console.log("Brands seeded successfully");
            await productTypeController.seedProductType();
            console.log("Product types seeded successfully");
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
