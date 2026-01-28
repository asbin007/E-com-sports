import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { OrderStatus } from "../../services/types.js";
import User from "./userModel.js";
import Payment from "./paymentModel.js";
import OrderItem from "./orderItemModel.js";

@Table({
  tableName: "orders",
  modelName: "Order",
  timestamps: true,
})
class Order extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phoneNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare addressLine: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare state: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare zipcode: string;

  @Column({
    type: DataType.ENUM(
      OrderStatus.Pending,
      OrderStatus.Confirmed,
      OrderStatus.Processing,
      OrderStatus.Shipped,
      OrderStatus.Delivered,
      OrderStatus.Cancelled,
      OrderStatus.Returned
    ),
    defaultValue: OrderStatus.Pending,
  })
  declare orderStatus: OrderStatus;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare totalPrice: number;

  @ForeignKey(() => Payment)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare paymentId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare paymentMethod: string;

  @Column({
    type: DataType.ENUM("pending", "paid", "failed"),
    defaultValue: "pending",
  })
  declare paymentStatus: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare paymentPid: string;

  @BelongsTo(() => User)
  declare User: User;

  @BelongsTo(() => Payment)
  declare Payment: Payment;

  @HasMany(() => OrderItem)
  declare OrderItems: OrderItem[];
}

export default Order;

