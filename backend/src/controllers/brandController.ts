import type { Request, Response } from "express";
import Brand from "../database/models/brandModel.js";
import { slugify } from "../utils/slugify.js";

class BrandController {
  brandData = [
    { name: "Nike", slug: "nike" },
    { name: "Adidas", slug: "adidas" },
    { name: "Puma", slug: "puma" },
  ];

  async seedBrand(): Promise<void> {
    const datas = await Brand.findAll();
    if (datas.length === 0) {
      await Brand.bulkCreate(this.brandData);
      console.log("Brands seeded successfully");
    } else {
      console.log("Brands already seeded");
    }
  }

  async getAllBrands(req: Request, res: Response): Promise<void> {
    const data = await Brand.findAll();
    res.status(200).json({
      message: "Fetched brands",
      data,
    });
  }

  async getBrandById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const brand = await Brand.findByPk(id);
    if (!brand) {
      res.status(404).json({
        message: "Brand not found",
      });
      return;
    }
    res.status(200).json({
      message: "Fetched brand",
      data: brand,
    });
  }

  async createBrand(req: Request, res: Response): Promise<void> {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({
        message: "Please provide brand name",
      });
      return;
    }
    const brand = await Brand.create({
      name,
      slug: slugify(name),
    });
    res.status(200).json({
      message: "Brand created successfully",
      data: brand,
    });
  }

  async deleteBrand(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    if (!id) {
      res.status(400).json({
        message: "Please provide id to delete",
      });
      return;
    }
    const data = await Brand.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No brand with that id",
      });
    } else {
      await Brand.destroy({
        where: {
          id,
        },
      });
      res.status(200).json({
        message: "Brand deleted successfully",
      });
    }
  }

  async updateBrand(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { name } = req.body;

    if (!id || !name) {
      res.status(400).json({
        message: "Please provide id and name to update",
      });
      return;
    }
    const data = await Brand.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No brand with that id",
      });
    } else {
      await Brand.update(
        {
          name: name,
          slug: slugify(name),
        },
        {
          where: {
            id,
          },
        }
      );
      res.status(200).json({
        message: "Brand updated successfully",
      });
    }
  }
}

export default new BrandController();
