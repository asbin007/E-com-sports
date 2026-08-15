import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import Category from "./categoryModel.js";
import Brand from "./brandModel.js";
import ProductType from "./productTypeModel.js";
import Sport from "./sportModel.js";
import Variant from "./variantModel.js";
import ProductImage from "./productImageModel.js";
import ProductAttribute from "./productAttributeModel.js";

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
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

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
    allowNull: true,
  })
  declare productTypeId: string;

  @ForeignKey(() => Sport)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare sportId: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isFeatured: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare allowCustomization: boolean;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  declare tags: string[];

  @BelongsTo(() => Category)
  declare Category: Category;

  @BelongsTo(() => Brand)
  declare Brand: Brand;

  @BelongsTo(() => ProductType)
  declare ProductType: ProductType;

  @BelongsTo(() => Sport)
  declare Sport: Sport;

  @HasMany(() => Variant)
  declare variants: Variant[];

  @HasMany(() => ProductImage)
  declare ProductImages: ProductImage[];

  @HasMany(() => ProductAttribute)
  declare ProductAttributes: ProductAttribute[];
}

export default Product;

