import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import User from "./userModel.js";
import Product from "./productModel.js";

@Table({
  tableName: "wishlists",
  modelName: "Wishlist",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "productId"],
    },
  ],
})
class Wishlist extends Model {
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
}

export default Wishlist;
