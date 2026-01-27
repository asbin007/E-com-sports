import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "users",
  modelName: "User",
  timestamps: true,
})
class User extends Model {
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
  declare username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare googleId: string;

  @Column({
    type: DataType.ENUM("customer", "admin"),
    defaultValue: "customer",
  })
  declare role: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatar: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "phone_number",
  })
  declare phoneNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare otp: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "otp_expiration",
  })
  declare otpExpiration: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: "isverified",
  })
  declare isVerified: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: "is_active",
  })
  declare isActive: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "last_login_at",
  })
  declare lastLoginAt: Date;
}

export default User;

