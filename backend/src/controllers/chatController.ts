import type { Request, Response } from "express";
import Chat from "../database/models/chatModel.js";
import Message from "../database/models/messageModel.js";
import User from "../database/models/userModel.js";
import { Op } from "sequelize";

class ChatController {
  // Create or get existing chat between customer and admin
  async getOrCreateChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { adminId, subject } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        where: {
          customerId: userId,
          status: { [Op.ne]: "closed" },
        },
        include: [
          { model: User, as: "Customer", attributes: ["id", "username", "avatar"] },
          { model: User, as: "Admin", attributes: ["id", "username", "avatar"] },
        ],
      });

      if (!chat) {
        // Find an available admin if not specified
        let assignedAdminId = adminId;

        if (!assignedAdminId) {
          const admin = await User.findOne({
            where: { role: "admin", isActive: true },
          });
          assignedAdminId = admin?.id || null;
        }

        chat = await Chat.create({
          customerId: userId,
          adminId: assignedAdminId,
          subject: subject || "General Inquiry",
          status: "open",
        });

        chat = await Chat.findByPk(chat.id, {
          include: [
            { model: User, as: "Customer", attributes: ["id", "username", "avatar"] },
            { model: User, as: "Admin", attributes: ["id", "username", "avatar"] },
          ],
        });
      }

      res.status(200).json({
        message: "Chat retrieved successfully",
        data: chat,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get messages in a chat
  async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params as { chatId: string };
      const { page = 1, limit = 50 } = req.query;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const chat = await Chat.findByPk(chatId);

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      // Check if user is part of this chat
      if (chat.customerId !== userId && chat.adminId !== userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Not authorized to view this chat" });
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: messages } = await Message.findAndCountAll({
        where: { chatId },
        include: [
          { model: User, as: "Sender", attributes: ["id", "username", "avatar", "role"] },
        ],
        limit: Number(limit),
        offset,
        order: [["createdAt", "ASC"]],
      });

      // Mark messages as read
      const isAdmin = req.user?.role === "admin";
      if (isAdmin) {
        await chat.update({ unreadAdmin: 0 });
      } else {
        await chat.update({ unreadCustomer: 0 });
      }

      res.status(200).json({
        message: "Messages fetched successfully",
        data: messages,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Send a message
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params as { chatId: string };
      const { content, imageUrl, messageType = "text" } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!content && !imageUrl) {
        res.status(400).json({ message: "Content or image is required" });
        return;
      }

      const chat = await Chat.findByPk(chatId);

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      // Check if user is part of this chat
      if (chat.customerId !== userId && chat.adminId !== userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Not authorized to send messages in this chat" });
        return;
      }

      const message = await Message.create({
        chatId,
        senderId: userId,
        content: content || "",
        imageUrl,
        messageType,
      });

      // Update unread count and last message time
      const isAdmin = req.user?.role === "admin";
      await chat.update({
        lastMessageAt: new Date(),
        unreadCustomer: isAdmin ? chat.unreadCustomer + 1 : chat.unreadCustomer,
        unreadAdmin: !isAdmin ? chat.unreadAdmin + 1 : chat.unreadAdmin,
      });

      const createdMessage = await Message.findByPk(message.id, {
        include: [
          { model: User, as: "Sender", attributes: ["id", "username", "avatar", "role"] },
        ],
      });

      res.status(201).json({
        message: "Message sent successfully",
        data: createdMessage,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get all chats (admin only)
  async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      if (!userId || req.user?.role !== "admin") {
        res.status(403).json({ message: "Admin access required" });
        return;
      }

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: chats } = await Chat.findAndCountAll({
        where,
        include: [
          { model: User, as: "Customer", attributes: ["id", "username", "email", "avatar"] },
          { model: User, as: "Admin", attributes: ["id", "username", "avatar"] },
          {
            model: Message,
            limit: 1,
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "Sender", attributes: ["id", "username"] }],
          },
        ],
        limit: Number(limit),
        offset,
        order: [["lastMessageAt", "DESC"]],
      });

      res.status(200).json({
        message: "Chats fetched successfully",
        data: chats,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get unread message count
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const isAdmin = req.user?.role === "admin";

      let unreadCount = 0;

      if (isAdmin) {
        const chats = await Chat.findAll({
          where: { adminId: userId },
          attributes: ["unreadAdmin"],
        });
        unreadCount = chats.reduce((sum, chat) => sum + chat.unreadAdmin, 0);
      } else {
        const chats = await Chat.findAll({
          where: { customerId: userId },
          attributes: ["unreadCustomer"],
        });
        unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCustomer, 0);
      }

      res.status(200).json({
        unreadCount,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Close a chat
  async closeChat(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { chatId } = req.params as { chatId: string };

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const chat = await Chat.findByPk(chatId);

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      if (chat.customerId !== userId && req.user?.role !== "admin") {
        res.status(403).json({ message: "Not authorized to close this chat" });
        return;
      }

      await chat.update({ status: "closed" });

      res.status(200).json({
        message: "Chat closed successfully",
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // Get customer's chats
  async getMyChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const chats = await Chat.findAll({
        where: { customerId: userId },
        include: [
          { model: User, as: "Admin", attributes: ["id", "username", "avatar"] },
          {
            model: Message,
            limit: 1,
            order: [["createdAt", "DESC"]],
          },
        ],
        order: [["lastMessageAt", "DESC"]],
      });

      res.status(200).json({
        message: "Chats fetched successfully",
        data: chats,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}

export default new ChatController();
