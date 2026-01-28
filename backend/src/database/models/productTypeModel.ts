import { Table, Column, Model, DataType } from "sequelize-typescript";

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
}

export default ProductType;
