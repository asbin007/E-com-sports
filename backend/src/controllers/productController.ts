import type { Request, Response } from "express";
import { Op } from "sequelize";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Variant from "../database/models/variantModel.js";
import Category from "../database/models/categoryModel.js";
import Brand from "../database/models/brandModel.js";
import Inventory from "../database/models/inventoryModel.js";

class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        categoryId,
        categoryName,
        brandId,
        sportType,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const where: any = { isActive: true };

      if (categoryId) where.categoryId = categoryId;
      if (sportType) where.sportType = sportType;
      if (brandId) where.brandId = brandId;
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const categoryWhere: any = {};
      if (categoryName) {
          categoryWhere.name = { [Op.iLike]: `%${categoryName}%` };
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
            where: Object.keys(categoryWhere).length > 0 ? categoryWhere : undefined,
          },
          {
            model: Brand,
            attributes: ["id", "name"],
          },
          {
            model: ProductImage,
            attributes: ["id", "url", "isPrimary"],
            limit: 1,
          },
        ],
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Products fetched successfully",
        data: products,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            attributes: ["id", "name", "description"],
          },
          {
            model: Brand,
            attributes: ["id", "name", "description"],
          },
          {
            model: ProductImage,
            attributes: ["id", "url", "publicId", "order", "isPrimary"],
            order: [["order", "ASC"]],
          },
          {
            model: Variant,
            include: [
              {
                model: Inventory,
                attributes: ["id", "stock", "reservedStock"],
              },
            ],
          },
        ],
      });

      if (!product) {
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }

      res.status(200).json({
        message: "Product fetched successfully",
        data: product,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, sportType, brandId, categoryId } = req.body;

      if (!name || !brandId || !categoryId) {
        res.status(400).json({
          message: "Name, brandId, and categoryId are required",
        });
        return;
      }

      const product = await Product.create({
        name,
        description,
        sportType,
        brandId,
        categoryId,
        isActive: true,
      });

      if (req.files && Array.isArray(req.files)) {
        const images = req.files as Express.Multer.File[];
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          if (!image) continue;

          await ProductImage.create({
            productId: product.id,
            url: image.path,
            publicId: (image as any).public_id,
            order: i,
            isPrimary: i === 0,
          });
        }
      }

      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            attributes: ["id", "name"],
          },
          {
            model: Brand,
            attributes: ["id", "name"],
          },
          {
            model: ProductImage,
            attributes: ["id", "url", "publicId"],
          },
        ],
      });

      res.status(201).json({
        message: "Product created successfully",
        data: createdProduct,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { name, description, sportType, brandId, categoryId, isActive } =
        req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }

      await product.update({
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        sportType: sportType !== undefined ? sportType : product.sportType,
        brandId: brandId || product.brandId,
        categoryId: categoryId || product.categoryId,
        isActive: isActive !== undefined ? isActive : product.isActive,
      });

      res.status(200).json({
        message: "Product updated successfully",
        data: product,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await Product.findByPk(id);

      if (!product) {
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }

      await product.update({ isActive: false });

      res.status(200).json({
        message: "Product deleted successfully",
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

export default new ProductController();

