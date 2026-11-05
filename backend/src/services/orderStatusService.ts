import sequelize from "../database/connection/connection.js";
import Order from "../database/models/orderModel.js";
import OrderItem from "../database/models/orderItemModel.js";
import Variant from "../database/models/variantModel.js";
import StatusHistory from "../database/models/statusHistoryModel.js";
import { stockEffectOf } from "../utils/orderStockEffect.js";

/**
 * The one way to change an order's status from the admin or customer side.
 * Returns false, changing nothing, when the order is already cancelled.
 */
export const changeOrderStatus = (orderId: string, status: string, note: string): Promise<boolean> =>
  sequelize.transaction(async (transaction) => {
    // The row lock makes a second cancel wait, then see "cancelled" and restore nothing.
    const order = await Order.findByPk(orderId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
      rejectOnEmpty: true,
    });

    const effect = stockEffectOf(order.orderStatus || "pending", status);
    if (effect === "refuse") return false;

    await order.update({ orderStatus: status }, { transaction });

    if (effect === "restore") {
      const items = await OrderItem.findAll({ where: { orderId }, transaction });
      for (const item of items) {
        if (item.variantId) {
          await Variant.increment("stock", {
            by: item.quantity,
            where: { id: item.variantId },
            transaction,
          });
        }
      }
    }

    await StatusHistory.create({ orderId, status, note }, { transaction });
    return true;
  });
