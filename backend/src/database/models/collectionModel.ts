import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "collections",
  modelName: "Collection",
  timestamps: true,
})
class Collection extends Model {
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
    type: DataType.STRING,
    allowNull: true,
  })
  declare imageUrl: string;

  @Column({
    type: DataType.ENUM("featured", "trending", "new_arrivals", "sale", "best_sellers", "custom"),
    defaultValue: "custom",
  })
  declare type: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare sortOrder: number;
}

export default Collection;
