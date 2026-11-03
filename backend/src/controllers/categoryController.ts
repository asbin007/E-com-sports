import type { Request, Response } from "express";
import Category from "../database/models/categoryModel.js";
import Product from "../database/models/productModel.js";
import { slugify } from "../utils/slugify.js";

class CategoryController {
  // Must stay identical to CATEGORIES in src/database/seeders/seedAll.ts —
  // both seed the same table, and they used to disagree.
  categoryData = [
    { name: "Football Boots",    slug: "football-boots",  needsSize: true,  sizeType: "shoe"     },
    { name: "Club Jerseys",      slug: "club-jerseys",    needsSize: true,  sizeType: "clothing" },
    { name: "Team Kits",         slug: "team-kits",       needsSize: true,  sizeType: "clothing" },
    { name: "Footballs",         slug: "footballs",       needsSize: true,  sizeType: "ball"     },
    { name: "Trophies & Medals", slug: "trophies-medals", needsSize: true,  sizeType: "trophy"   },
    { name: "Training Wear",     slug: "training-wear",   needsSize: true,  sizeType: "clothing" },
    { name: "Bags",              slug: "bags",            needsSize: false, sizeType: null       },
    { name: "Accessories",       slug: "accessories",     needsSize: false, sizeType: null       },
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
      res.status(500).json({ message: "Internal server error" });
    }
  }

  /**
   * Public callers get the categories the shop is actually trading in, so
   * retiring one is a reversible `isActive` toggle in admin rather than a
   * delete. Admin passes ?includeInactive=true to manage the hidden ones.
   */
  async getAllCategories(req: Request, res: Response): Promise<void> {
    const includeInactive = req.query.includeInactive === "true";

    const data = await Category.findAll({
      ...(includeInactive ? {} : { where: { isActive: true } }),
      order: [["name", "ASC"]],
    });

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
    const { name, needsSize, sizeType } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ message: "Please provide a category name" });
      return;
    }

    // The admin form asks for a name, not a URL slug — nobody running a shop
    // should have to invent one. Requiring it here meant creating a category
    // from the panel always failed with a 400.
    const slug = (typeof req.body.slug === "string" && req.body.slug.trim())
      ? slugify(req.body.slug)
      : slugify(name);

    if (!slug) {
      res.status(400).json({ message: "Category name must contain letters or numbers" });
      return;
    }

    const existing = await Category.findOne({ where: { slug } });
    if (existing) {
      res.status(409).json({ message: `A category with the slug "${slug}" already exists` });
      return;
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      needsSize: needsSize === undefined ? true : needsSize === true || needsSize === "true",
      sizeType: sizeType || null,
    });
    res.status(201).json({ message: "Category created successfully", data: category });
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
      // Category.hasMany(Product, { foreignKey: "categoryId" }) has no onDelete,
      // and Product.categoryId is NOT NULL — so Sequelize would CASCADE and wipe
      // every product in this category (plus its images, variants, inventory,
      // order items and reviews). Refuse instead of silently destroying them.
      const productCount = await Product.count({ where: { categoryId: id } });
      if (productCount > 0) {
        res.status(409).json({
          message: `Cannot delete this category: ${productCount} product${productCount === 1 ? " is" : "s are"} still assigned to it. Reassign or remove ${productCount === 1 ? "it" : "them"} first.`,
          productCount,
        });
        return;
      }
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
