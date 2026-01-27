import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Category from "./categoryModel.js";
import Brand from "./brandModel.js";

@Table({
  tableName: "products",
  modelName: "Product",
  timestamps: true,
})
class Product extends Model {
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
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare sportType: string;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare brandId: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare categoryId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @BelongsTo(() => Brand)
  declare Brand: Brand;

  @BelongsTo(() => Category)
  declare Category: Category;
}

export default Product;

