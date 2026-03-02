import type { Request, Response } from "express";
import Category from "../database/models/categoryModel.js";

class CategoryController {
  categoryData = [
    { name: "Jersey",       slug: "jersey",       needsSize: true,  sizeType: "clothing" },
    { name: "Shoes",        slug: "shoes",         needsSize: true,  sizeType: "shoe"     },
    { name: "Shoe Variety", slug: "shoe-variety",  needsSize: true,  sizeType: "shoe"     },
    { name: "Socks",        slug: "socks",         needsSize: true,  sizeType: "clothing" },
    { name: "Gear",         slug: "gear",          needsSize: false, sizeType: null       },
  ];

  async seedCategory(): Promise<void> {
    const datas = await Category.findAll();
    if (datas.length === 0) {
      await Category.bulkCreate(this.categoryData);
      console.log("Categories seeded successfully");
    } else {
      console.log("Categories already seeded");
    }
  }

  // Admin-only: wipe and re-seed categories (Option A — clean slate)
  async reseedCategories(req: Request, res: Response): Promise<void> {
    try {
      await Category.destroy({ where: {}, truncate: true });
      await Category.bulkCreate(this.categoryData);
      res.status(200).json({
        message: "Categories re-seeded successfully",
        data: this.categoryData,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  async getAllCategories(req: Request, res: Response): Promise<void> {
    const data = await Category.findAll();
    res.status(200).json({
      message: "Fetched categories",
      data,
    });
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const category = await Category.findByPk(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(200).json({ message: "Fetched category", data: category });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const { name, slug, needsSize, sizeType } = req.body;
    if (!name || !slug) {
      res.status(400).json({ message: "Please provide category name and slug" });
      return;
    }
    const category = await Category.create({ name, slug, needsSize: needsSize ?? true, sizeType: sizeType ?? null });
    res.status(200).json({ message: "Category created successfully", data: category });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    if (!id) {
      res.status(400).json({ message: "Please provide id to delete" });
      return;
    }
    const data = await Category.findByPk(id);
    if (!data) {
      res.status(404).json({ message: "No category with that id" });
    } else {
      await Category.destroy({ where: { id } });
      res.status(200).json({ message: "Category deleted successfully" });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { name, slug, needsSize, sizeType } = req.body;
    if (!id || !name) {
      res.status(400).json({ message: "Please provide id and name to update" });
      return;
    }
    const data = await Category.findByPk(id);
    if (!data) {
      res.status(404).json({ message: "No category with that id" });
    } else {
      await data.update({ name, slug, needsSize, sizeType });
      res.status(200).json({ message: "Category updated successfully" });
    }
  }
}

export default new CategoryController();
