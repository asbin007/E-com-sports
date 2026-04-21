import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import Product from "./productModel.js";

@Table({
  tableName: "sports",
  modelName: "Sport",
  timestamps: true,
})
class Sport extends Model {
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
    type: DataType.STRING,
    allowNull: true,
  })
  declare iconUrl: string;

  @HasMany(() => Product)
  declare products: Product[];
}

export default Sport;
