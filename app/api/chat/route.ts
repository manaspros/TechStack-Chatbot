import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";
import { buildChatContext, trimContextToFit } from "@/lib/contextManager";
import { getSession } from "@/lib/auth";

// Get all chats for the logged-in user
export async function GET(req: NextRequest) {
  try {
    // Get the session data from Auth0
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Not authenticated", chats: [] },
        { status: 401 }
      );
    }

    const userId = session.user.sub;

    try {
      await connectToDatabase();
    } catch (dbError: any) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details:
            process.env.NODE_ENV === "development"
              ? dbError.message
              : "Internal server error",
        },
        { status: 500 }
      );
    }

    // Query database for all chat sessions for this user
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 }) // Sort by most recent
      .select("title updatedAt createdAt _id") // Include _id explicitly
      .limit(50); // Limit to recent 50 chats

    // Ensure _id is properly stringified
    const formattedChats = chats.map((chat) => ({
      id: chat._id.toString(), // Explicitly convert ObjectId to string
      title: chat.title || "Untitled Chat",
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    console.log(
      `Returning ${formattedChats.length} chats, first ID: ${
        formattedChats[0]?.id || "none"
      }`
    );
    return NextResponse.json({ chats: formattedChats });
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chats",
        details: process.env.NODE_ENV === "development" ? error.message : null,
      },
      { status: 500 }
    );
  }
}

// Create a new chat or update an existing chat with context awareness
export async function POST(req: NextRequest) {
  try {
    // Extract user info from the session
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;
    const userEmail = session.user.email || "unknown@example.com";

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { chatId, message, title } = body;

    // Check if this is an update to existing chat or a new chat
    if (chatId) {
      // Update existing chat
      const chat = await Chat.findOne({ _id: chatId, userId });

      if (!chat) {
        return NextResponse.json(
          { error: "Chat not found or unauthorized" },
          { status: 404 }
        );
      }

      // Add new message to the chat
      chat.messages.push(message);
      chat.updatedAt = new Date();
      chat.lastMessageIndex = chat.messages.length;

      // Update title if provided
      if (title) {
        chat.title = title;
      }

      await chat.save();
      return NextResponse.json({ chat });
    } else {
      // Create a new chat
      const newChat = new Chat({
        userId,
        userEmail,
        title: title || "New Chat",
        messages: [message],
        lastMessageIndex: 1,
      });

      await newChat.save();
      return NextResponse.json({ chat: newChat });
    }
  } catch (error: any) {
    console.error("Error saving chat:", error);
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  }
}
