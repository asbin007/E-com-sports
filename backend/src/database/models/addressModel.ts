import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./userModel.js";

@Table({
  tableName: "addresses",
  modelName: "Address",
  timestamps: true,
})
class Address extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare line1: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare line2: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare city: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare state: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare zipcode: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isDefault: boolean;

  @BelongsTo(() => User)
  declare User: User;
}

export default Address;

