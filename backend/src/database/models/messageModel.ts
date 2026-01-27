import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import Chat from "./chatModel.js";
import User from "./userModel.js";

@Table({
  tableName: "messages",
  modelName: "Message",
  timestamps: true,
})
class Message extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Chat)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: "chat_id",
  })
  declare chatId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: "sender_id",
  })
  declare senderId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "image_url",
  })
  declare imageUrl: string;

  @Column({
    type: DataType.ENUM("text", "image", "file"),
    defaultValue: "text",
    field: "message_type",
  })
  declare messageType: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: "is_read",
  })
  declare isRead: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "read_at",
  })
  declare readAt: Date;
}

export default Message;
