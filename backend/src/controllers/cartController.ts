import type { Request, Response } from "express";
import CartItem from "../database/models/cartItemModel.js";
import Variant from "../database/models/variantModel.js";
import Product from "../database/models/productModel.js";
import ProductImage from "../database/models/productImageModel.js";
import Inventory from "../database/models/inventoryModel.js";
import Brand from "../database/models/brandModel.js";
import inventoryService from "../services/inventoryService.js";

class CartController {
  async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { variantId, quantity } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!variantId || !quantity || quantity < 1) {
        res.status(400).json({
          message: "variantId and quantity (min 1) are required",
        });
        return;
      }

      const variant = await Variant.findByPk(variantId, {
        include: [
          {
            model: Product,
            include: [
              {
                model: ProductImage,
                attributes: ["id", "url", "isPrimary"],
                limit: 1,
              },
            ],
          },
        ],
      });

      if (!variant) {
        res.status(404).json({ message: "Variant not found" });
        return;
      }

      const hasStock = await inventoryService.checkStock(variantId, quantity);
      if (!hasStock) {
        res.status(400).json({
          message: "Insufficient stock available",
        });
        return;
      }

      const existingCartItem = await CartItem.findOne({
        where: { userId, variantId },
      });

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity;
        const hasStockForNewQty = await inventoryService.checkStock(
          variantId,
          newQuantity
        );
        if (!hasStockForNewQty) {
          res.status(400).json({
            message: "Insufficient stock for requested quantity",
          });
          return;
        }
        await existingCartItem.update({ quantity: newQuantity });
      } else {
        await CartItem.create({
          userId,
          variantId,
          quantity,
        });
      }

      const cartItems = await CartItem.findAll({
        where: { userId },
        include: [
          {
            model: Variant,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: ProductImage,
                    attributes: ["id", "url", "isPrimary"],
                    limit: 1,
                  },
                ],
              },
              {
                model: Inventory,
                attributes: ["id", "stock", "reservedStock"],
              },
            ],
          },
        ],
      });

      res.status(201).json({
        message: "Product added to cart successfully",
        data: cartItems,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cartItems = await CartItem.findAll({
        where: { userId },
        include: [
          {
            model: Variant,
            include: [
              {
                model: Product,
                include: [
                  {
                    model: ProductImage,
                    attributes: ["id", "url", "isPrimary"],
                    order: [["order", "ASC"]],
                  },
                  {
                    model: Brand,
                    attributes: ["id", "name"],
                  },
                ],
              },
              {
                model: Inventory,
                attributes: ["id", "stock", "reservedStock"],
              },
            ],
          },
        ],
      });

      let totalPrice = 0;
      cartItems.forEach((item) => {
        const price = item.Variant.salePrice || item.Variant.price;
        totalPrice += price * item.quantity;
      });

      res.status(200).json({
        message: "Cart fetched successfully",
        data: cartItems,
        totalPrice,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async updateCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };
      const { quantity } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!quantity || quantity < 1) {
        res.status(400).json({
          message: "Quantity must be at least 1",
        });
        return;
      }

      const cartItem = await CartItem.findOne({
        where: { id, userId },
        include: [{ model: Variant }],
      });

      if (!cartItem) {
        res.status(404).json({ message: "Cart item not found" });
        return;
      }

      const hasStock = await inventoryService.checkStock(
        cartItem.variantId,
        quantity
      );
      if (!hasStock) {
        res.status(400).json({
          message: "Insufficient stock available",
        });
        return;
      }

      await cartItem.update({ quantity });

      res.status(200).json({
        message: "Cart updated successfully",
        data: cartItem,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cartItem = await CartItem.findOne({
        where: { id, userId },
      });

      if (!cartItem) {
        res.status(404).json({ message: "Cart item not found" });
        return;
      }

      await cartItem.destroy();

      res.status(200).json({
        message: "Product removed from cart successfully",
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

export default new CartController();

