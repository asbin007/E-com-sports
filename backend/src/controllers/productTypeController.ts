import type { Request, Response } from "express";
import ProductType from "../database/models/productTypeModel.js";
import Category from "../database/models/categoryModel.js";
import { slugify } from "../utils/slugify.js";

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
    if (datas.length !== 0) {
      console.log("Product types already seeded");
      return;
    }

    const categories = await Category.findAll();
    const fallbackCategoryId = categories[0]?.id;

    // product_types are related to Category via `categoryId` (NOT NULL),
    // but product type "Shoes/Jersey/..." doesn't inherently map 1:1 to sport categories.
    // We use a sensible mapping so seeding works and the DB constraints are satisfied.
    const categoryNameByProductTypeName: Record<string, string> = {
      Shoes: "Running",
      Jersey: "Football",
      Accessories: "Gym & Fitness",
      Shorts: "Basketball",
      Socks: "Cricket",
      Bags: "Outdoor",
    };

    const categoryByName = new Map(categories.map((c) => [c.name, c.id]));

    const rows = this.productTypeData.map((d) => {
      const categoryName =
        categoryNameByProductTypeName[d.name] ?? "Running";
      const categoryId = categoryByName.get(categoryName) ?? fallbackCategoryId;
      return {
        name: d.name,
        description: d.description,
        slug: slugify(d.name),
        categoryId,
      };
    });

    if (!fallbackCategoryId) {
      throw new Error(
        "Cannot seed product types: no categories found in database."
      );
    }

    await ProductType.bulkCreate(rows);
    console.log("Product types seeded successfully");
  }

  async addProductType(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({
        message: "Please provide product type name",
      });
      return;
    }

    const categories = await Category.findAll();
    const fallbackCategoryId = categories[0]?.id;

    const categoryNameByProductTypeName: Record<string, string> = {
      Shoes: "Running",
      Jersey: "Football",
      Accessories: "Gym & Fitness",
      Shorts: "Basketball",
      Socks: "Cricket",
      Bags: "Outdoor",
    };
    const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
    const resolvedCategoryId =
      req.body?.categoryId ??
      categoryByName.get(categoryNameByProductTypeName[name] ?? "Running") ??
      fallbackCategoryId;

    if (!resolvedCategoryId) {
      res.status(500).json({
        message: "Cannot create product type without a categoryId",
      });
      return;
    }

    const productType = await ProductType.create({
      name,
      description,
      slug: slugify(name),
      categoryId: resolvedCategoryId,
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
      const categories = await Category.findAll();
      const fallbackCategoryId = categories[0]?.id;

      const categoryNameByProductTypeName: Record<string, string> = {
        Shoes: "Running",
        Jersey: "Football",
        Accessories: "Gym & Fitness",
        Shorts: "Basketball",
        Socks: "Cricket",
        Bags: "Outdoor",
      };
      const categoryByName = new Map(categories.map((c) => [c.name, c.id]));

      const resolvedCategoryId =
        req.body?.categoryId ??
        categoryByName.get(
          categoryNameByProductTypeName[name] ?? "Running"
        ) ??
        fallbackCategoryId;

      await ProductType.update(
        {
          name: name,
          description: description,
          slug: slugify(name),
          categoryId: resolvedCategoryId,
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
