import type { Request, Response } from "express";
import Category from "../database/models/categoryModel.js";
import Product from "../database/models/productModel.js";

class CategoryController {
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Product,
            attributes: ["id", "name"],
          },
        ],
      });

      res.status(200).json({
        message: "Categories fetched successfully",
        data: categories,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const category = await Category.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ["id", "name", "description"],
          },
        ],
      });

      if (!category) {
        res.status(404).json({
          message: "Category not found",
        });
        return;
      }

      res.status(200).json({
        message: "Category fetched successfully",
        data: category,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, imageUrl } = req.body;

      if (!name) {
        res.status(400).json({
          message: "Category name is required",
        });
        return;
      }

      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        res.status(400).json({
          message: "Category already exists",
        });
        return;
      }

      const category = await Category.create({
        name,
        description,
        imageUrl,
      });

      res.status(201).json({
        message: "Category created successfully",
        data: category,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { name, description, imageUrl } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        res.status(404).json({
          message: "Category not found",
        });
        return;
      }

      await category.update({
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        imageUrl: imageUrl !== undefined ? imageUrl : category.imageUrl,
      });

      res.status(200).json({
        message: "Category updated successfully",
        data: category,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const category = await Category.findByPk(id);

      if (!category) {
        res.status(404).json({
          message: "Category not found",
        });
        return;
      }

      await category.destroy();

      res.status(200).json({
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default new CategoryController();

