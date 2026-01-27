import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import Collection from "./collectionModel.js";
import Product from "./productModel.js";

@Table({
  tableName: "collection_products",
  modelName: "CollectionProduct",
  timestamps: true,
})
class CollectionProduct extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Collection)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare collectionId: string;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare productId: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare sortOrder: number;
}

export default CollectionProduct;
