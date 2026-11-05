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

/**
 * Variants come back in whatever order Postgres hands them over — there is no
 * ORDER BY on a hasMany include — so `variants[0]` was a different row between
 * requests and the price on a card could change on reload. Sort by creation so
 * the order is stable, and read the headline price off a variant a shopper can
 * actually buy rather than whichever row arrived first.
 */
const sortVariants = (list: any[]): any[] =>
  [...list].sort((a, b) => {
    const at = new Date(a?.createdAt ?? 0).getTime();
    const bt = new Date(b?.createdAt ?? 0).getTime();
    if (at !== bt) return at - bt;
    return String(a?.id ?? "").localeCompare(String(b?.id ?? ""));
  });

const priceSource = (variants: any[]): any =>
  variants.find((v) => v.isActive !== false && Number(v.stock) > 0) ??
  variants.find((v) => v.isActive !== false) ??
  variants[0];

/** Flattens Sequelize's alias keys and attaches the headline price. */
const normalizeProduct = (json: any) => {
  const variantsList = sortVariants(
    json.variants?.length ? json.variants : (json.Variants ?? []),
  );
  const imagesList = json.ProductImages?.length ? json.ProductImages : (json.images ?? []);
  const attributesList = json.ProductAttributes?.length
    ? json.ProductAttributes
    : (json.attributes ?? []);
  const { Variants, ProductImages, ProductAttributes, variants, images, attributes, ...rest } = json;
  const headline = priceSource(variantsList);

  return {
    ...rest,
    variants: variantsList,
    images: imagesList,
    attributes: attributesList,
    price: headline?.price || 0,
    originalPrice: headline?.originalPrice || null,
  };
};

class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        categoryId,
        categoryName,
        brandId,
        productTypeId,
        search,
        featured,
        page = 1,
        limit = 20,
      } = req.query;

      const where: any = { isActive: true };

      if (categoryId) where.categoryId = categoryId;
      if (brandId) where.brandId = brandId;
      if (productTypeId) where.productTypeId = productTypeId;
      if (featured === "true" || featured === "1") where.isFeatured = true;
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
            as: "variants",
            attributes: ["id", "size", "color", "price", "originalPrice", "costPrice", "stock", "isActive", "createdAt"],
          },
          {
            model: ProductImage,
            as: "ProductImages",
            attributes: ["id", "url", "altText", "isThumbnail", "sortOrder"],
          },
          {
            model: ProductAttribute,
            as: "ProductAttributes",
            attributes: ["id", "attributeName", "attributeValue"],
          },
        ],
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
        // Without this the hasMany includes (variants, images, attributes)
        // multiply the rows and `count` returns the size of the join, not the
        // number of products — 418 for a catalogue of 32.
        distinct: true,
      });

      const normalizedProducts = products.map((p: any) => normalizeProduct(p.toJSON()));

      res.status(200).json({
        message: "Products fetched successfully",
        data: normalizedProducts,
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
            as: "variants",
            attributes: ["id", "size", "color", "price", "originalPrice", "costPrice", "stock", "isActive", "createdAt"],
          },
          {
            model: ProductImage,
            as: "ProductImages",
            attributes: ["id", "url", "altText", "isThumbnail", "sortOrder"],
          },
          {
            model: ProductAttribute,
            as: "ProductAttributes",
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

      // Normalize for frontend compatibility — Sequelize attaches HasMany rows
      // under the alias used in the include (`Variants`, `ProductImages`,
      // `ProductAttributes`). Older clients reading lowercase keys also work.
      const normalizedProduct = normalizeProduct(product.toJSON());

      res.status(200).json({
        message: "Product fetched successfully",
        data: normalizedProduct,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const { name, description, categoryId, brandId, productTypeId, sportId, gender } = req.body;

      // Only name, categoryId, brandId are truly required
      if (!name || !categoryId || !brandId) {
        await transaction.rollback();
        res.status(400).json({ message: "Name, categoryId, and brandId are required" });
        return;
      }

      const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Ensure unique slug
      let uniqueSlug = slug;
      let suffix = 1;
      while (true) {
        const existing = await Product.findOne({ where: { slug: uniqueSlug }, transaction, paranoid: false });
        if (!existing) break;
        suffix += 1;
        uniqueSlug = `${slug}-${suffix}`;
        if (suffix > 1000) {
          await transaction.rollback();
          res.status(409).json({ message: "Could not generate a unique slug" });
          return;
        }
      }

      // Parse variants and attributes from FormData JSON strings
      let variants: any[] = [];
      let attributes: any[] = [];
      try {
        variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
        attributes = typeof req.body.attributes === "string" ? JSON.parse(req.body.attributes) : (req.body.attributes || []);
      } catch (e) {
        console.error("Failed to parse variants/attributes:", e);
      }

      // Create product
      const product = await Product.create({
        name,
        slug: uniqueSlug,
        description: description || null,
        brandId,
        categoryId,
        productTypeId: productTypeId && productTypeId !== "" ? productTypeId : null,
        sportId: sportId && sportId !== "" ? sportId : null,
        gender: gender || "Unisex",
        isActive: req.body.isActive !== "false" && req.body.isActive !== false,
        isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
        allowCustomization: req.body.allowCustomization === "true" || req.body.allowCustomization === true,
        tags: req.body.tags ? (typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags) : [],
      }, { transaction });

      // Create variants
      if (variants.length > 0) {
        await Promise.all(variants.map((v: any) =>
          Variant.create({
            productId: product.id,
            size: v.size || null,
            color: v.color || null,
            price: parseFloat(v.price) || 0,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            isActive: v.isActive !== false,
          }, { transaction })
        ));
      }

      // Create attributes
      if (attributes.length > 0) {
        await Promise.all(attributes.map((attr: any) =>
          ProductAttribute.create({
            productId: product.id,
            attributeName: attr.attributeName,
            attributeValue: attr.attributeValue,
          }, { transaction })
        ));
      }

      // Create images
      if (req.files && Array.isArray(req.files)) {
        const filesArr = req.files as Express.Multer.File[];
        const thumbIdx = parseInt(req.body.thumbnailIndex) || 0;
        await Promise.all(filesArr.map((file, index) =>
          ProductImage.create({
            productId: product.id,
            url: (file as any).path || (file as any).secure_url || `/uploads/${file.filename}`,
            isThumbnail: index === thumbIdx,
            sortOrder: index,
          }, { transaction })
        ));
      }

      await transaction.commit();

      // Fetch complete product with relations
      const completeProduct = await Product.findByPk(product.id, {
        include: [
          { model: Category, attributes: ["id", "name", "needsSize", "sizeType", "slug"] },
          { model: Brand, attributes: ["id", "name", "slug", "logo"] },
          { model: ProductType, attributes: ["id", "name", "slug"] },
          { model: Sport, attributes: ["id", "name", "slug"] },
          { model: Variant, as: "variants" },
          { model: ProductImage, as: "ProductImages" },
          { model: ProductAttribute, as: "ProductAttributes" },
        ],
      });

      res.status(201).json({ message: "Product created successfully", data: completeProduct });
    } catch (error: any) {
      await transaction.rollback();
      console.error(error);
      if (error?.name === "SequelizeUniqueConstraintError") {
        res.status(409).json({ message: "A product with this name/slug already exists" });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params as { id: string };
      const { name, description, categoryId, brandId, productTypeId, sportId, gender } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        await transaction.rollback();
        res.status(404).json({ message: "Product not found" });
        return;
      }

      // Parse variants and attributes
      let variants: any[] = [];
      let attributes: any[] = [];
      try {
        variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
        attributes = typeof req.body.attributes === "string" ? JSON.parse(req.body.attributes) : (req.body.attributes || []);
      } catch (e) {
        console.error("Failed to parse variants/attributes:", e);
      }

      // Update product fields
      await product.update({
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        brandId: brandId || product.brandId,
        categoryId: categoryId || product.categoryId,
        productTypeId: productTypeId !== undefined && productTypeId !== "" ? productTypeId : (productTypeId === "" ? null : product.productTypeId),
        sportId: sportId !== undefined && sportId !== "" ? sportId : (sportId === "" ? null : product.sportId),
        gender: gender || product.gender,
        isActive: req.body.isActive !== undefined ? (req.body.isActive === "true" || req.body.isActive === true) : product.isActive,
        isFeatured: req.body.isFeatured !== undefined ? (req.body.isFeatured === "true" || req.body.isFeatured === true) : product.isFeatured,
        allowCustomization: req.body.allowCustomization !== undefined ? (req.body.allowCustomization === "true" || req.body.allowCustomization === true) : product.allowCustomization,
        tags: req.body.tags !== undefined ? (typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags) : product.tags,
      }, { transaction });

      // Reconcile variants in place rather than deleting and recreating them.
      // `order_items.variantId` is ON DELETE SET NULL, so a delete-and-recreate
      // silently cut every past order loose from its variant — and the stock
      // restore in orderStatusService only runs `if (item.variantId)`, so
      // cancelling one of those orders put nothing back and still reported
      // success. Matching rows keep their ids, and a variant the admin dropped
      // is deactivated instead of deleted so the history survives.
      if (variants.length > 0) {
        const existing = await Variant.findAll({ where: { productId: product.id }, transaction });
        const keyOf = (size: unknown, color: unknown) =>
          `${size ?? ""}::${color ?? ""}`.toLowerCase();

        const byId = new Map(existing.map((v) => [String(v.id), v]));
        const byKey = new Map(existing.map((v) => [keyOf(v.size, v.color), v]));
        const kept = new Set<string>();

        for (const v of variants) {
          const fields = {
            size: v.size || null,
            color: v.color || null,
            price: parseFloat(v.price) || 0,
            originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            isActive: v.isActive !== false,
          };

          // An id the client echoed back wins; otherwise the same size+colour
          // is the same variant as far as a shopkeeper is concerned.
          const match =
            (v.id && byId.get(String(v.id))) || byKey.get(keyOf(fields.size, fields.color));

          if (match) {
            await match.update(fields, { transaction });
            kept.add(String(match.id));
          } else {
            const created = await Variant.create(
              { productId: product.id, ...fields },
              { transaction },
            );
            kept.add(String(created.id));
          }
        }

        const dropped = existing.filter((v) => !kept.has(String(v.id)));
        if (dropped.length > 0) {
          await Variant.update(
            { isActive: false, stock: 0 },
            { where: { id: dropped.map((v) => v.id) }, transaction },
          );
        }
      }

      // Replace attributes if provided
      if (attributes.length > 0) {
        await ProductAttribute.destroy({ where: { productId: product.id }, transaction });
        await Promise.all(attributes.map((attr: any) =>
          ProductAttribute.create({
            productId: product.id,
            attributeName: attr.attributeName,
            attributeValue: attr.attributeValue,
          }, { transaction })
        ));
      }

      // Replace the gallery outright when the caller sends imageUrls.
      // Uploading only ever appended, so there was no way to change a product's
      // main photo once it had one — an admin could add pictures but never fix
      // a wrong one. Sending imageUrls: [] clears the gallery.
      let replacedImages = false;
      if (req.body.imageUrls !== undefined) {
        let urls: unknown;
        try {
          urls = typeof req.body.imageUrls === "string" ? JSON.parse(req.body.imageUrls) : req.body.imageUrls;
        } catch {
          await transaction.rollback();
          res.status(400).json({ message: "imageUrls must be a JSON array of URLs" });
          return;
        }
        if (!Array.isArray(urls) || urls.some((u) => typeof u !== "string" || !/^https?:\/\//i.test(u))) {
          await transaction.rollback();
          res.status(400).json({ message: "imageUrls must be an array of http(s) URLs" });
          return;
        }

        await ProductImage.destroy({ where: { productId: product.id }, transaction });
        await Promise.all((urls as string[]).map((url, index) =>
          ProductImage.create({
            productId: product.id,
            url,
            isThumbnail: index === 0,
            sortOrder: index,
          }, { transaction })
        ));
        replacedImages = true;
      }

      // Append new images
      if (!replacedImages && req.files && Array.isArray(req.files) && req.files.length > 0) {
        const currentImages = await ProductImage.findAll({ where: { productId: product.id } });
        const startSortOrder = currentImages.length;
        await Promise.all((req.files as Express.Multer.File[]).map((file, index) =>
          ProductImage.create({
            productId: product.id,
            url: (file as any).path || (file as any).secure_url || `/uploads/${file.filename}`,
            isThumbnail: currentImages.length === 0 && index === 0,
            sortOrder: startSortOrder + index,
          }, { transaction })
        ));
      }

      await transaction.commit();

      // Fetch updated product with relations
      const updatedProduct = await Product.findByPk(id, {
        include: [
          { model: Category, attributes: ["id", "name", "needsSize", "sizeType", "slug"] },
          { model: Brand, attributes: ["id", "name", "slug", "logo"] },
          { model: ProductType, attributes: ["id", "name", "slug"] },
          { model: Sport, attributes: ["id", "name", "slug"] },
          { model: Variant, as: "variants" },
          { model: ProductImage, as: "ProductImages" },
          { model: ProductAttribute, as: "ProductAttributes" },
        ],
      });

      res.status(200).json({ message: "Product updated successfully", data: updatedProduct });
    } catch (error: any) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
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
      });
    }
  }
}

export default new ProductController();

