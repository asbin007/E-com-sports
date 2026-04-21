import type { Request, Response } from "express";
import { Op } from "sequelize";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Variant from "../database/models/variantModel.js";
import Category from "../database/models/categoryModel.js";
import Brand from "../database/models/brandModel.js";
import ProductType from "../database/models/productTypeModel.js";
import Sport from "../database/models/sportModel.js";
import ProductAttribute from "../database/models/productAttributeModel.js";
import CollectionProduct from "../database/models/collectionProductModel.js";
import sequelize from "../database/connection/connection.js";

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
            attributes: ["id", "name", "needsSize", "sizeType", "slug"],
            where: Object.keys(categoryWhere).length > 0 ? categoryWhere : undefined,
          },
          {
            model: Brand,
            attributes: ["id", "name", "slug", "logo"],
          },
          {
            model: ProductType,
            attributes: ["id", "name", "description", "slug"],
          },
          {
            model: Sport,
            attributes: ["id", "name", "slug", "iconUrl"],
          },
          {
            model: Variant,
            attributes: ["id", "size", "color", "price", "originalPrice", "costPrice", "stock", "isActive"],
          },
          {
            model: ProductImage,
            attributes: ["id", "url", "altText", "isThumbnail", "sortOrder"],
          },
          {
            model: ProductAttribute,
            attributes: ["id", "attributeName", "attributeValue"],
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
            attributes: ["id", "name", "needsSize", "sizeType", "slug"],
          },
          {
            model: Brand,
            attributes: ["id", "name", "slug", "logo"],
          },
          {
            model: ProductType,
            attributes: ["id", "name", "description", "slug"],
          },
          {
            model: Sport,
            attributes: ["id", "name", "slug", "iconUrl"],
          },
          {
            model: Variant,
            attributes: ["id", "size", "color", "price", "originalPrice", "costPrice", "stock", "isActive"],
          },
          {
            model: ProductImage,
            attributes: ["id", "url", "altText", "isThumbnail", "sortOrder"],
          },
          {
            model: ProductAttribute,
            attributes: ["id", "attributeName", "attributeValue"],
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
    const transaction = await sequelize.transaction();
    try {
      console.log("DEBUG: createProduct called");
      
      const {
        name,
        description,
        categoryId,
        sportId,
        gender,
        isActive,
      } = req.body;

      const slug = req.body.slug || req.body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || "";
      let brandId = req.body.brandId;
      let productTypeId = req.body.productTypeId;

      if (req.body.brand && !brandId) {
        const [brandRecord] = await Brand.findOrCreate({ 
          where: { name: req.body.brand }, 
          defaults: { slug: req.body.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') } 
        });
        brandId = brandRecord.id;
      }

      if (!productTypeId) {
        const [ptRecord] = await ProductType.findOrCreate({ 
          where: { name: "General" }, 
          defaults: { slug: "general" } 
        });
        productTypeId = ptRecord.id;
      }

      // Variants and Attributes are expected to be sent as JSON strings if using FormData
      let variants: any[] = [];
      let attributes: any[] = [];
      
      try {
        variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
        attributes = typeof req.body.attributes === "string" ? JSON.parse(req.body.attributes) : (req.body.attributes || []);
      } catch (e) {
        console.error("Failed to parse variants or attributes", e);
      }

      if (variants.length === 0 && (req.body.sizes || req.body.colors || req.body.price)) {
        const sizes = req.body.sizes ? req.body.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : ["Standard"];
        const colors = req.body.colors ? req.body.colors.split(',').map((c: string) => c.trim()).filter(Boolean) : ["Default"];
        
        sizes.forEach((size: string) => {
          colors.forEach((color: string) => {
            variants.push({
              size,
              color,
              price: parseFloat(req.body.price) || 0,
              originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
              costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : null,
              stock: parseInt(req.body.totalStock) || parseInt(req.body.stock) || 0
            });
          });
        });
      }

      if (attributes.length === 0 && req.body.features) {
        const features = req.body.features.split(',').map((f: string) => f.trim()).filter(Boolean);
        features.forEach((feature: string) => {
          attributes.push({
            attributeName: "Feature",
            attributeValue: feature,
          });
        });
      }

      if (!name || !slug || !categoryId || !brandId || !productTypeId) {
        await transaction.rollback();
        res.status(400).json({
          message: "Name, slug, categoryId, brandId, and productTypeId are required",
        });
        return;
      }

      // 1. Create Base Product
      const product = await Product.create({
        name,
        slug,
        description,
        brandId,
        categoryId,
        productTypeId,
        sportId: sportId || null,
        gender,
        isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
      }, { transaction });

      // 2. Create Variants
      if (variants.length > 0) {
        const variantPromises = variants.map((v: any) => 
          Variant.create({
            productId: product.id,
            size: v.size,
            color: v.color,
            price: parseFloat(v.price) || 0,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
          }, { transaction })
        );
        await Promise.all(variantPromises);
      }

      // 3. Create Attributes
      if (attributes.length > 0) {
        const attributePromises = attributes.map((attr: any) => 
          ProductAttribute.create({
            productId: product.id,
            attributeName: attr.attributeName,
            attributeValue: attr.attributeValue,
          }, { transaction })
        );
        await Promise.all(attributePromises);
      }

      // 4. Create Images
      if (req.files && Array.isArray(req.files)) {
        const imagePromises = (req.files as Express.Multer.File[]).map((file, index) => 
          ProductImage.create({
            productId: product.id,
            url: `/uploads/${file.filename}`,
            isThumbnail: index === 0, // Set first image as thumbnail by default
            sortOrder: index,
          }, { transaction })
        );
        await Promise.all(imagePromises);
      }

      // 5. Add to Collection if collectionId is provided
      if (req.body.collectionId) {
        await CollectionProduct.create({
          productId: product.id,
          collectionId: req.body.collectionId,
        }, { transaction });
      }

      await transaction.commit();

      res.status(201).json({
        message: "Product created successfully",
        data: product,
      });
    } catch (error: any) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params as { id: string };
      const {
        name,
        description,
        categoryId,
        sportId,
        isActive,
        gender,
      } = req.body;

      // Parse variants and attributes if sent as JSON string
      let variants: any[] = [];
      let attributes: any[] = [];
      try {
        variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
        attributes = typeof req.body.attributes === "string" ? JSON.parse(req.body.attributes) : (req.body.attributes || []);
      } catch (e) {
        console.error("Failed to parse variants or attributes", e);
      }

      if (variants.length === 0 && (req.body.sizes || req.body.colors || req.body.price)) {
        const sizes = req.body.sizes ? req.body.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : ["Standard"];
        const colors = req.body.colors ? req.body.colors.split(',').map((c: string) => c.trim()).filter(Boolean) : ["Default"];
        
        sizes.forEach((size: string) => {
          colors.forEach((color: string) => {
            variants.push({
              size,
              color,
              price: parseFloat(req.body.price) || 0,
              originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
              costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : null,
              stock: parseInt(req.body.totalStock) || parseInt(req.body.stock) || 0
            });
          });
        });
      }

      if (attributes.length === 0 && req.body.features) {
        const features = req.body.features.split(',').map((f: string) => f.trim()).filter(Boolean);
        features.forEach((feature: string) => {
          attributes.push({
            attributeName: "Feature",
            attributeValue: feature,
          });
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        await transaction.rollback();
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }
      
      const slug = req.body.slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : product.slug);
      let brandId = req.body.brandId || product.brandId;
      let productTypeId = req.body.productTypeId || product.productTypeId;

      if (req.body.brand && req.body.brand !== product.brandId) {
        const [brandRecord] = await Brand.findOrCreate({ 
          where: { name: req.body.brand }, 
          defaults: { slug: req.body.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') } 
        });
        brandId = brandRecord.id;
      }

      const updateData = {
        name: name || product.name,
        slug: slug,
        description: description !== undefined ? description : product.description,
        brandId: brandId,
        categoryId: categoryId || product.categoryId,
        productTypeId: productTypeId,
        sportId: sportId !== undefined ? sportId : product.sportId,
        gender: gender || product.gender,
        isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : product.isActive,
      };

      await product.update(updateData, { transaction });

      // 2. Update Variants (Replace All strategy for simplicity, or upsert based on logic)
      if (variants.length > 0) {
        await Variant.destroy({ where: { productId: product.id }, transaction });
        const variantPromises = variants.map((v: any) => 
          Variant.create({
            productId: product.id,
            size: v.size,
            color: v.color,
            price: parseFloat(v.price) || 0,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            isActive: v.isActive !== undefined ? v.isActive : true,
          }, { transaction })
        );
        await Promise.all(variantPromises);
      }

      // 3. Update Attributes (Replace All strategy)
      if (attributes.length > 0) {
        await ProductAttribute.destroy({ where: { productId: product.id }, transaction });
        const attributePromises = attributes.map((attr: any) => 
          ProductAttribute.create({
            productId: product.id,
            attributeName: attr.attributeName,
            attributeValue: attr.attributeValue,
          }, { transaction })
        );
        await Promise.all(attributePromises);
      }

      // 4. Handle Images (Append new images)
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Fetch current max sortOrder
        const currentImages = await ProductImage.findAll({ where: { productId: product.id } });
        const startSortOrder = currentImages.length;
        
        const newImages = (req.files as Express.Multer.File[]).map((file, index) => 
          ProductImage.create({
            productId: product.id,
            url: `/uploads/${file.filename}`,
            isThumbnail: currentImages.length === 0 && index === 0, // Fallback if no images exist
            sortOrder: startSortOrder + index,
          }, { transaction })
        );
        await Promise.all(newImages);
      }

      if (req.body.collectionId) {
        // Remove old associations and add new one
        await CollectionProduct.destroy({ where: { productId: product.id }, transaction });
        await CollectionProduct.create({
          productId: product.id,
          collectionId: req.body.collectionId,
        }, { transaction });
      }

      await transaction.commit();

      res.status(200).json({
        message: "Product updated successfully",
        data: product,
      });
    } catch (error: any) {
      await transaction.rollback();
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

