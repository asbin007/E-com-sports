import type { Request, Response } from "express";
import Collection from "../database/models/collectionModel.js";
import CollectionProduct from "../database/models/collectionProductModel.js";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Brand from "../database/models/brandModel.js";
import Category from "../database/models/categoryModel.js";
import Variant from "../database/models/variantModel.js";

class CollectionController {
  async createCollection(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug, description, imageUrl, type, sortOrder } = req.body;

      if (!name || !slug) {
        res.status(400).json({ message: "Name and slug are required" });
        return;
      }

      const existingSlug = await Collection.findOne({ where: { slug } });
      if (existingSlug) {
        res.status(400).json({ message: "Collection with this slug already exists" });
        return;
      }

      const collection = await Collection.create({
        name,
        slug,
        description,
        imageUrl,
        type: type || "custom",
        sortOrder: sortOrder || 0,
      });

      res.status(201).json({
        message: "Collection created successfully",
        data: collection,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getAllCollections(req: Request, res: Response): Promise<void> {
    try {
      const { includeInactive } = req.query;

      const where: any = {};
      if (!includeInactive) {
        where.isActive = true;
      }

      const collections = await Collection.findAll({
        where,
        order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
      });

      res.status(200).json({
        message: "Collections fetched successfully",
        data: collections,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getCollectionBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params as { slug: string };
      const { page = 1, limit = 20 } = req.query;

      const collection = await Collection.findOne({ where: { slug } });

      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: collectionProducts } = await CollectionProduct.findAndCountAll({
        where: { collectionId: collection.id },
        include: [
          {
            model: Product,
            where: { isActive: true },
            include: [
              {
                model: ProductImage,
                attributes: ["id", "url", "isPrimary"],
                limit: 1,
              },
              {
                model: Brand,
                attributes: ["id", "name"],
              },
              {
                model: Category,
                attributes: ["id", "name"],
              },
              {
                model: Variant,
                attributes: ["id", "price", "salePrice", "size", "color"],
                limit: 1,
              },
            ],
          },
        ],
        limit: Number(limit),
        offset,
        order: [["sortOrder", "ASC"]],
      });

      const products = collectionProducts.map((cp: any) => cp.Product);

      res.status(200).json({
        message: "Collection products fetched successfully",
        collection: {
          id: collection.id,
          name: collection.name,
          slug: collection.slug,
          description: collection.description,
          imageUrl: collection.imageUrl,
        },
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

  async updateCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { name, slug, description, imageUrl, type, isActive, sortOrder } = req.body;

      const collection = await Collection.findByPk(id);

      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }

      if (slug && slug !== collection.slug) {
        const existingSlug = await Collection.findOne({ where: { slug } });
        if (existingSlug) {
          res.status(400).json({ message: "Collection with this slug already exists" });
          return;
        }
      }

      await collection.update({
        name: name || collection.name,
        slug: slug || collection.slug,
        description: description !== undefined ? description : collection.description,
        imageUrl: imageUrl !== undefined ? imageUrl : collection.imageUrl,
        type: type || collection.type,
        isActive: isActive !== undefined ? isActive : collection.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : collection.sortOrder,
      });

      res.status(200).json({
        message: "Collection updated successfully",
        data: collection,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async deleteCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };

      const collection = await Collection.findByPk(id);

      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }

      await CollectionProduct.destroy({ where: { collectionId: id } });
      await collection.destroy();

      res.status(200).json({
        message: "Collection deleted successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async addProductToCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId, productId, sortOrder } = req.body;

      if (!collectionId || !productId) {
        res.status(400).json({ message: "Collection ID and product ID are required" });
        return;
      }

      const collection = await Collection.findByPk(collectionId);
      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      const existing = await CollectionProduct.findOne({
        where: { collectionId, productId },
      });

      if (existing) {
        res.status(400).json({ message: "Product already in collection" });
        return;
      }

      await CollectionProduct.create({
        collectionId,
        productId,
        sortOrder: sortOrder || 0,
      });

      res.status(201).json({
        message: "Product added to collection successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async removeProductFromCollection(req: Request, res: Response): Promise<void> {
    try {
      const { collectionId, productId } = req.params as { collectionId: string, productId: string };

      const collectionProduct = await CollectionProduct.findOne({
        where: { collectionId, productId },
      });

      if (!collectionProduct) {
        res.status(404).json({ message: "Product not in collection" });
        return;
      }

      await collectionProduct.destroy();

      res.status(200).json({
        message: "Product removed from collection successfully",
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

export default new CollectionController();
