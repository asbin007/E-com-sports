import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "brands",
  modelName: "Brand",
  timestamps: true,
})
class Brand extends Model {
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
}

export default Brand;

