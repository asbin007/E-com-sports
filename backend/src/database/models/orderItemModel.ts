import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Order from "./orderModel.js";
import Product from "./productModel.js";

@Table({
  tableName: "order_items",
  modelName: "OrderItem",
  timestamps: true,
})
class OrderItem extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare orderId: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare productId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare productName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true, // no per-size SKU in new schema
  })
  declare sku: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare size: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare color: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare quantity: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare totalPrice: number;

  @BelongsTo(() => Order)
  declare Order: Order;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default OrderItem;

