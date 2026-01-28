import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Category from "./categoryModel.js";
import Brand from "./brandModel.js";
import ProductType from "./productTypeModel.js";

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
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare price: number; // Selling Price

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare originalPrice: number; // MRP

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare costPrice: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare discount: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare sizes: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare colors: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare images: string[];

  @Column({
    type: DataType.ENUM("Men", "Women", "Kids", "Unisex"),
    allowNull: true,
  })
  declare gender: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare categoryId: string;

  @ForeignKey(() => Brand)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare brandId: string;

  @ForeignKey(() => ProductType)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productTypeId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @BelongsTo(() => Category)
  declare Category: Category;

  @BelongsTo(() => Brand)
  declare Brand: Brand;

  @BelongsTo(() => ProductType)
  declare ProductType: ProductType;
}

export default Product;

