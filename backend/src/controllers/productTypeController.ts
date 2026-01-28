import type { Request, Response } from "express";
import ProductType from "../database/models/productTypeModel.js";

class ProductTypeController {
  productTypeData = [
    {
      name: "Shoes",
      description: "Footwear for sports and casual wear",
    },
    {
      name: "Jersey",
      description: "Sports jerseys and team wear",
    },
    {
      name: "Accessories",
      description: "Sports accessories and gear",
    },
    {
      name: "Shorts",
      description: "Athletic shorts and bottoms",
    },
    {
      name: "Socks",
      description: "Sports socks and footwear accessories",
    },
    {
      name: "Bags",
      description: "Sports bags and backpacks",
    },
  ];

  async seedProductType(): Promise<void> {
    const datas = await ProductType.findAll();
    if (datas.length === 0) {
      await ProductType.bulkCreate(this.productTypeData);
      console.log("Product types seeded successfully");
    } else {
      console.log("Product types already seeded");
    }
  }

  async addProductType(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({
        message: "Please provide product type name",
      });
      return;
    }
    const productType = await ProductType.create({
      name,
      description,
    });
    res.status(200).json({
      message: "Product type created successfully",
      data: productType,
    });
  }

  async getProductTypes(req: Request, res: Response): Promise<void> {
    const data = await ProductType.findAll();
    res.status(200).json({
      message: "Fetched product types",
      data,
    });
  }

  async getProductTypeById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const productType = await ProductType.findByPk(id);
    if (!productType) {
      res.status(404).json({
        message: "Product type not found",
      });
      return;
    }
    res.status(200).json({
      message: "Fetched product type",
      data: productType,
    });
  }

  async deleteProductType(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    if (!id) {
      res.status(400).json({
        message: "Please provide id to delete",
      });
      return;
    }
    const data = await ProductType.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No product type with that id",
      });
    } else {
      await ProductType.destroy({
        where: {
          id,
        },
      });
      res.status(200).json({
        message: "Product type deleted successfully",
      });
    }
  }

  async updateProductType(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const { name, description } = req.body;

    if (!id || !name) {
      res.status(400).json({
        message: "Please provide id and name to update",
      });
      return;
    }
    const data = await ProductType.findAll({
      where: {
        id: id,
      },
    });
    if (data.length === 0) {
      res.status(404).json({
        message: "No product type with that id",
      });
    } else {
      await ProductType.update(
        {
          name: name,
          description: description,
        },
        {
          where: {
            id,
          },
        }
      );
      res.status(200).json({
        message: "Product type updated successfully",
      });
    }
  }
}

export default new ProductTypeController();
