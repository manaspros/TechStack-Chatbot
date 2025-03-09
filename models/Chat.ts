import mongoose, { Schema, Document } from "mongoose";

// Define the structure of a chat message
export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Define the structure of a chat session
export interface IChat extends Document {
  userId: string;
  userEmail: string;
  messages: IMessage[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create schema for messages within a chat
const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create schema for the chat
const ChatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    index: true, // Add index for faster queries by userId
  },
  userEmail: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "New Chat",
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to optimize query performance
ChatSchema.index({ userId: 1, createdAt: -1 });

// Check if the model is already defined to prevent redefinition in development with hot reload
export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
