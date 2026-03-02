import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./userModel.js";
import Product from "./productModel.js";

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

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  declare size: string | null; // null for Gear / accessories

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare quantity: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare priceAtAdd: number; // price snapshot at time of add

  @BelongsTo(() => User)
  declare User: User;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default CartItem;
