import type { Request, Response } from "express";
import CartItem from "../database/models/cartItemModel.js";
import Product from "../database/models/productModel.js";
import Brand from "../database/models/brandModel.js";
import Category from "../database/models/categoryModel.js";
import Variant from "../database/models/variantModel.js";
import { parseQuantity, MAX_QUANTITY, QUANTITY_ERROR } from "../utils/quantity.js";

class CartController {
  async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { productId, size } = req.body;
      // Unvalidated, a negative quantity sails past `targetStock < quantity`
      // and lands a negative row in the cart, which then subtracts from the
      // order total at checkout.
      const quantity = parseQuantity(req.body.quantity ?? 1);

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!productId) {
        res.status(400).json({ message: "productId is required" });
        return;
      }

      if (quantity === null) {
        res.status(400).json({ message: QUANTITY_ERROR });
        return;
      }

      const product = await Product.findByPk(productId, {
        include: [
          { model: Category, attributes: ["id", "name", "needsSize", "sizeType"] },
          { model: Variant, as: "variants" }
        ],
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      if (!product.isActive) {
        res.status(400).json({ message: "Product is not available" });
        return;
      }

      // Validate size requirement based on category
      const needsSize = product.Category?.needsSize ?? true;
      if (needsSize && !size) {
        res.status(400).json({
          message: `Please select a size for this ${product.Category?.name || "product"}`,
        });
        return;
      }

      // Stock and Price check via Variant
      let variantPrice = 0;
      let targetStock = 0;

      const sellable = ((product as any).variants ?? []).filter(
        (v: any) => v.isActive !== false,
      );

      if (needsSize) {
        const variant = sellable.find((v: any) => v.size === size);
        if (!variant) {
          res.status(400).json({ message: `Size ${size} is not available` });
          return;
        }
        targetStock = variant.stock;
        variantPrice = variant.price;
      } else {
        // Find default variant if no size needed
        const variant = sellable[0];
        if (!variant) {
          res.status(400).json({ message: "No active variant found" });
          return;
        }
        targetStock = variant.stock;
        variantPrice = variant.price;
      }

      if (targetStock < quantity) {
        res.status(400).json({ message: "Insufficient stock available" });
        return;
      }

      // Upsert — find existing cart item for same product + size combo
      const existingItem = await CartItem.findOne({
        where: {
          userId,
          productId,
          ...(size ? { size } : {}),
        },
      });

      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > MAX_QUANTITY) {
          res.status(400).json({ message: QUANTITY_ERROR });
          return;
        }
        if (targetStock < newQty) {
          res.status(400).json({ message: "Insufficient stock for requested quantity" });
          return;
        }
        await existingItem.update({ quantity: newQty });
      } else {
        await CartItem.create({
          userId,
          productId,
          size: needsSize ? size : null,
          quantity,
          priceAtAdd: variantPrice,
        });
      }

      const cartItems = await this._fetchCart(userId);
      const totalPrice = cartItems.reduce((sum: number, item: any) => sum + item.priceAtAdd * item.quantity, 0);

      res.status(201).json({
        message: "Product added to cart successfully",
        data: cartItems,
        totalPrice,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cartItems = await this._fetchCart(userId);
      const totalPrice = cartItems.reduce((sum: number, item: any) => sum + item.priceAtAdd * item.quantity, 0);

      res.status(200).json({ message: "Cart fetched successfully", data: cartItems, totalPrice });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };
      const { quantity } = req.body;

      if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }
      const parsedQuantity = parseQuantity(quantity);
      if (parsedQuantity === null) { res.status(400).json({ message: QUANTITY_ERROR }); return; }

      const cartItem = await CartItem.findOne({ 
        where: { id, userId }, 
        include: [{ 
          model: Product,
          include: [{ model: Variant, as: "variants" }] 
        }] 
      });
      if (!cartItem) { res.status(404).json({ message: "Cart item not found" }); return; }

      const product = cartItem.Product as any;
      const sellable = (product.variants ?? []).filter((v: any) => v.isActive !== false);
      const variant = sellable.find((v: any) => v.size === cartItem.size) || sellable[0];
      const targetStock = variant ? variant.stock : 0;

      if (targetStock < parsedQuantity) {
        res.status(400).json({ message: "Insufficient stock available" });
        return;
      }

      await cartItem.update({ quantity: parsedQuantity });
      res.status(200).json({ message: "Cart updated successfully", data: cartItem });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params as { id: string };

      if (!userId) { res.status(401).json({ message: "Unauthorized" }); return; }

      const cartItem = await CartItem.findOne({ where: { id, userId } });
      if (!cartItem) { res.status(404).json({ message: "Cart item not found" }); return; }

      await cartItem.destroy();
      res.status(200).json({ message: "Product removed from cart successfully" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  private async _fetchCart(userId: string) {
    return CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "slug"],
          include: [
            { model: Brand, attributes: ["id", "name"] },
            { model: Variant, as: "variants", attributes: ["price", "originalPrice", "stock", "size", "color"] }
          ],
        },
      ],
    });
  }
}

export default new CartController();
