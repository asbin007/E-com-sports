import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import User from "./userModel.js";
import Product from "./productModel.js";

@Table({
  tableName: "product_reviews",
  modelName: "ProductReview",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "productId"],
    },
  ],
})
class ProductReview extends Model {
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
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  declare rating: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare comment: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isVerifiedPurchase: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isVisible: boolean;
}

export default ProductReview;
