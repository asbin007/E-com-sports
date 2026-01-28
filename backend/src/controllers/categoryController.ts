import type { Request, Response } from "express";
import Category from "../database/models/categoryModel.js";

class CategoryController {
  categoryData = [
    {
      name: "Football",
    },
    {
      name: "Cricket",
    },
    {
      name: "Basketball",
    },
    {
      name: "Running",
    },
    {
      name: "Tennis",
    },
    {
      name: "Badminton",
    },
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
      res.status(404).json({
        message: "Category not found",
      });
      return;
    }
    res.status(200).json({
      message: "Fetched category",
      data: category,
    });
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({
        message: "Please provide category name",
      });
      return;
    }
    const category = await Category.create({
      name,
    });
    res.status(200).json({
      message: "Category created successfully",
      data: category,
    });
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    if (!id) {
      res.status(400).json({
        message: "Please provide id to delete",
      });
      return;
    }
    const data = await Category.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No category with that id",
      });
    } else {
      await Category.destroy({
        where: {
          id,
        },
      });
      res.status(200).json({
        message: "Category deleted successfully",
      });
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { name } = req.body;

    if (!id || !name) {
      res.status(400).json({
        message: "Please provide id and name to update",
      });
      return;
    }
    const data = await Category.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No category with that id",
      });
    } else {
      await Category.update(
        {
          name: name,
        },
        {
          where: {
            id,
          },
        }
      );
      res.status(200).json({
        message: "Category updated successfully",
      });
    }
  }
}

export default new CategoryController();
