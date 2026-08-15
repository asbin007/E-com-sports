import type { Request, Response } from "express";
import Sport from "../database/models/sportModel.js";

const DEFAULT_SPORTS = [
  { name: "Football", slug: "football" },
  { name: "Cricket", slug: "cricket" },
  { name: "Basketball", slug: "basketball" },
  { name: "Volleyball", slug: "volleyball" },
  { name: "Badminton", slug: "badminton" },
  { name: "Tennis", slug: "tennis" },
  { name: "Table Tennis", slug: "table-tennis" },
  { name: "Swimming", slug: "swimming" },
  { name: "Running", slug: "running" },
  { name: "Fitness", slug: "fitness" },
];

export async function seedSports(): Promise<void> {
  try {
    for (const sport of DEFAULT_SPORTS) {
      await Sport.findOrCreate({
        where: { slug: sport.slug },
        defaults: { name: sport.name, slug: sport.slug },
      });
    }
    console.log("✅ Sports seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding sports:", error);
  }
}

class SportController {
  async getAllSports(req: Request, res: Response): Promise<void> {
    try {
      const sports = await Sport.findAll({
        order: [["name", "ASC"]],
      });
      res.status(200).json({
        message: "Sports fetched successfully",
        data: sports,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async createSport(req: Request, res: Response): Promise<void> {
    try {
      const { name, iconUrl } = req.body;

      if (!name) {
        res.status(400).json({ message: "Sport name is required" });
        return;
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const existing = await Sport.findOne({ where: { slug } });
      if (existing) {
        res.status(409).json({ message: "Sport already exists" });
        return;
      }

      const sport = await Sport.create({ name, slug, iconUrl: iconUrl || null });

      res.status(201).json({
        message: "Sport created successfully",
        data: sport,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async deleteSport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sport = await Sport.findByPk(id);

      if (!sport) {
        res.status(404).json({ message: "Sport not found" });
        return;
      }

      await sport.destroy();

      res.status(200).json({ message: "Sport deleted successfully" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new SportController();
