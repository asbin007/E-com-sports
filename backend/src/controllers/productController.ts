import type { Request, Response } from "express";
import { Op } from "sequelize";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Variant from "../database/models/variantModel.js";
import Category from "../database/models/categoryModel.js";
import Brand from "../database/models/brandModel.js";
import ProductType from "../database/models/productTypeModel.js";
import Inventory from "../database/models/inventoryModel.js";

class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        categoryId,
        categoryName,
        brandId,
        productTypeId,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const where: any = { isActive: true };

      if (categoryId) where.categoryId = categoryId;
      if (brandId) where.brandId = brandId;
      if (productTypeId) where.productTypeId = productTypeId;
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
            model: ProductType,
            attributes: ["id", "name", "description"],
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
            attributes: ["id", "name"],
          },
          {
            model: Brand,
            attributes: ["id", "name"],
          },
          {
            model: ProductType,
            attributes: ["id", "name", "description"],
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
      console.log("DEBUG: createProduct called");
      console.log("DEBUG: req.body:", req.body);
      console.log("DEBUG: req.files:", req.files);

      const {
        name,
        description,
        brandId,
        categoryId,
        productTypeId,
        gender,
        price,
        originalPrice,
        stock,
        discount,
        sizes,
        colors,
        isNew,
        features,
        // sku,
      } = (req.body || {}) as any;

      if (!name || !categoryId || !brandId || !productTypeId) {
        res.status(400).json({
          message: "Name, categoryId, brandId, and productTypeId are required",
        });
        return;
      }

      let images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        images = (req.files as Express.Multer.File[]).map((file) => `/uploads/${file.filename}`);
      }

      const product = await Product.create({
        name,
        description,
        brandId,
        categoryId,
        productTypeId,
        gender,
        price: price ? parseFloat(price) : 0,
        discount: discount ? parseInt(discount) : 0,
        originalPrice: originalPrice ? parseFloat(originalPrice) : 0,
        stock: stock ? parseInt(stock) : 0,
        sizes: sizes ? sizes.split(",") : [],
        colors: colors ? colors.split(",") : [],
        features: features ? features.split("\n") : [],
        isNew: isNew === "true" || isNew === true,

        images,
        isActive: true,
      });

      res.status(201).json({
        message: "Product created successfully",
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

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const {
        name,
        description,
        brandId,
        categoryId,
        productTypeId,
        isActive,
        gender,
        price,
        originalPrice,
        stock,
        discount,
        sizes,
        colors,
        isNew,
        features,
        // sku,
      } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }

      // Logic to append images (referenced from nike-backend)
      let images = product.images || [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
         const newImages = (req.files as Express.Multer.File[]).map((file) => `/uploads/${file.filename}`);
         images = [...images, ...newImages];
      }

      // Helper to valid numbers or return undefined (to fallback to existing)
      const parseOrUndefined = (val: any) => {
         const parsed = parseFloat(val);
         return isNaN(parsed) ? undefined : parsed;
       }
      
      const updateData = {
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        brandId: brandId || product.brandId,
        categoryId: categoryId || product.categoryId,
        productTypeId: productTypeId || product.productTypeId,
        isActive: isActive !== undefined ? isActive : product.isActive,
        gender: gender || product.gender,
        
        // Use helper to avoid NaN. If undefined, use existing product value.
        price: parseOrUndefined(price) ?? product.price,
        discount: parseOrUndefined(discount) ?? product.discount,
        originalPrice: parseOrUndefined(originalPrice) ?? product.originalPrice,
        stock: parseOrUndefined(stock) ?? product.stock,

        sizes: sizes ? sizes.split(",") : product.sizes,
        colors: colors ? colors.split(",") : product.colors,
        features: features ? features.split("\n") : product.features,
        isNew: isNew !== undefined ? (isNew === "true" || isNew === true) : product.isNew,
        
        images: images,
      };

      await product.update(updateData);

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

