import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Product from "./productModel.js";

@Table({
  tableName: "variants",
  modelName: "Variant",
  timestamps: true,
})
class Variant extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productId: string;

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
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  declare originalPrice: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  declare costPrice: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default Variant;

