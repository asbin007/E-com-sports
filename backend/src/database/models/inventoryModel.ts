import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import Variant from "./variantModel.js";

@Table({
  tableName: "inventory",
  modelName: "Inventory",
  timestamps: true,
})
class Inventory extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Variant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
  })
  declare variantId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare stock: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare reservedStock: number;

  @BelongsTo(() => Variant)
  declare Variant: Variant;
}

export default Inventory;

