import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Category from "./categoryModel.js";

@Table({
  tableName: "product_types",
  modelName: "ProductType",
  timestamps: true,
})
class ProductType extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare categoryId: string;

  @BelongsTo(() => Category)
  declare Category: Category;
}

export default ProductType;
