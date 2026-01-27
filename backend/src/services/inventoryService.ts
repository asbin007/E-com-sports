import Inventory from "../database/models/inventoryModel.js";
import Variant from "../database/models/variantModel.js";

class InventoryService {
  async checkStock(variantId: string, quantity: number): Promise<boolean> {
    const inventory = await Inventory.findOne({
      where: { variantId },
      include: [{ model: Variant }],
    });

    if (!inventory) {
      return false;
    }

    const availableStock = inventory.stock - inventory.reservedStock;
    return availableStock >= quantity;
  }

  async reserveStock(variantId: string, quantity: number): Promise<boolean> {
    const inventory = await Inventory.findOne({
      where: { variantId },
    });

    if (!inventory) {
      return false;
    }

    const availableStock = inventory.stock - inventory.reservedStock;
    if (availableStock < quantity) {
      return false;
    }

    await inventory.increment("reservedStock", { by: quantity });
    return true;
  }

  async releaseStock(variantId: string, quantity: number): Promise<void> {
    const inventory = await Inventory.findOne({
      where: { variantId },
    });

    if (inventory) {
      await inventory.decrement("reservedStock", { by: quantity });
    }
  }

  async confirmStock(variantId: string, quantity: number): Promise<void> {
    const inventory = await Inventory.findOne({
      where: { variantId },
    });

    if (inventory) {
      await inventory.decrement("stock", { by: quantity });
      await inventory.decrement("reservedStock", { by: quantity });
    }
  }

  async getAvailableStock(variantId: string): Promise<number> {
    const inventory = await Inventory.findOne({
      where: { variantId },
    });

    if (!inventory) {
      return 0;
    }

    return inventory.stock - inventory.reservedStock;
  }
}

export default new InventoryService();

