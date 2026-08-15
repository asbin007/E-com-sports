import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Order from "./orderModel.js";

@Table({
  tableName: "status_history",
  modelName: "StatusHistory",
  timestamps: true,
})
class StatusHistory extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare note: string;

  @BelongsTo(() => Order)
  declare Order: Order;
}

export default StatusHistory;
