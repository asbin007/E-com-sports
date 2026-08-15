import { Table, Column, Model, DataType, HasOne } from "sequelize-typescript";
import { PaymentStatus } from "../../services/types.js";

@Table({
  tableName: "payments",
  modelName: "Payment",
  timestamps: true,
})
class Payment extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare paymentMethod: string;

  @Column({
    type: DataType.ENUM(
      PaymentStatus.Pending,
      PaymentStatus.Paid,
      PaymentStatus.Failed,
      PaymentStatus.Refunded
    ),
    defaultValue: PaymentStatus.Pending,
  })
  declare paymentStatus: PaymentStatus;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare amount: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerRef: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare pidx: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare metadata: Record<string, any>;

  declare Order: any;
}

export default Payment;

