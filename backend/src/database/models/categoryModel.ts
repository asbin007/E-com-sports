import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "categories",
  modelName: "Category",
  timestamps: true,
})
class Category extends Model {
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
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare slug: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare needsSize: boolean;

  @Column({
    type: DataType.ENUM("clothing", "shoe"),
    allowNull: true,
    defaultValue: null,
  })
  declare sizeType: "clothing" | "shoe" | null;
}

export default Category;
