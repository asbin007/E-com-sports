import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import User from "./userModel.js";

@Table({
  tableName: "chats",
  modelName: "Chat",
  timestamps: true,
})
class Chat extends Model {
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
    field: "customer_id",
  })
  declare customerId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: "admin_id",
  })
  declare adminId: string;

  @Column({
    type: DataType.ENUM("open", "closed", "pending"),
    defaultValue: "open",
  })
  declare status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare subject: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "last_message_at",
  })
  declare lastMessageAt: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: "unread_customer",
  })
  declare unreadCustomer: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: "unread_admin",
  })
  declare unreadAdmin: number;
}

export default Chat;
