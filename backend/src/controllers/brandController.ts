import type { Request, Response } from "express";
import Brand from "../database/models/brandModel.js";
import Product from "../database/models/productModel.js";

class BrandController {
  async getAllBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await Brand.findAll({
        include: [
          {
            model: Product,
            attributes: ["id", "name"],
          },
        ],
      });

      res.status(200).json({
        message: "Brands fetched successfully",
        data: brands,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getBrandById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const brand = await Brand.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ["id", "name", "description"],
          },
        ],
      });

      if (!brand) {
        res.status(404).json({
          message: "Brand not found",
        });
        return;
      }

      res.status(200).json({
        message: "Brand fetched successfully",
        data: brand,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async createBrand(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, logoUrl } = req.body;

      if (!name) {
        res.status(400).json({
          message: "Brand name is required",
        });
        return;
      }

      const existingBrand = await Brand.findOne({ where: { name } });
      if (existingBrand) {
        res.status(400).json({
          message: "Brand already exists",
        });
        return;
      }

      const brand = await Brand.create({
        name,
        description,
        logoUrl,
      });

      res.status(201).json({
        message: "Brand created successfully",
        data: brand,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateBrand(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { name, description, logoUrl } = req.body;

      const brand = await Brand.findByPk(id);
      if (!brand) {
        res.status(404).json({
          message: "Brand not found",
        });
        return;
      }

      await brand.update({
        name: name || brand.name,
        description: description !== undefined ? description : brand.description,
        logoUrl: logoUrl !== undefined ? logoUrl : brand.logoUrl,
      });

      res.status(200).json({
        message: "Brand updated successfully",
        data: brand,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async deleteBrand(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const brand = await Brand.findByPk(id);

      if (!brand) {
        res.status(404).json({
          message: "Brand not found",
        });
        return;
      }

      await brand.destroy();

      res.status(200).json({
        message: "Brand deleted successfully",
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

export default new BrandController();

