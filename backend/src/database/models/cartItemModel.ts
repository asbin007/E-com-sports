import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./userModel.js";
import Variant from "./variantModel.js";

@Table({
  tableName: "cart_items",
  modelName: "CartItem",
  timestamps: true,
})
class CartItem extends Model {
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

  @ForeignKey(() => Variant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare variantId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare quantity: number;

  @BelongsTo(() => User)
  declare User: User;

  @BelongsTo(() => Variant)
  declare Variant: Variant;
}

export default CartItem;

