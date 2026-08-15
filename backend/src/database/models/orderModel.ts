import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import User from "./userModel.js";
import Payment from "./paymentModel.js";
import OrderItem from "./orderItemModel.js";
import StatusHistory from "./statusHistoryModel.js";

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

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare orderNumber: string;

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
    type: DataType.STRING,
    defaultValue: "pending",
  })
  declare orderStatus: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare totalPrice: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  declare subtotal: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    defaultValue: 0,
  })
  declare deliveryCharge: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare customerNote: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare whatsappConfirmed: boolean;

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
    type: DataType.STRING,
    defaultValue: "pending",
  })
  declare paymentStatus: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare paymentPid: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare paymentScreenshot: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "payment_rejection_reason",
  })
  declare paymentRejectionReason: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare deliveryBoyId: string;

  @BelongsTo(() => User)
  declare User: User;

  @BelongsTo(() => Payment)
  declare Payment: Payment;

  @HasMany(() => OrderItem)
  declare OrderItems: OrderItem[];

  @HasMany(() => StatusHistory)
  declare StatusHistories: StatusHistory[];
}

export default Order;
