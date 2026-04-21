import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Product from "./productModel.js";

@Table({
  tableName: "product_attributes",
  modelName: "ProductAttribute",
  timestamps: true,
})
class ProductAttribute extends Model {
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
  declare attributeName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare attributeValue: string;

  @BelongsTo(() => Product)
  declare Product: Product;
}

export default ProductAttribute;
