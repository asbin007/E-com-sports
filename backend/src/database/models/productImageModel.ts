import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Product from "./productModel.js";

@Table({
  tableName: "product_images",
  modelName: "ProductImage",
  timestamps: true,
})
class ProductImage extends Model {
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
    allowNull: false,
  })
  declare url: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare publicId: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare order: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isPrimary: boolean;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default ProductImage;

