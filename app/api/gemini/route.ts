import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";
import { buildChatContext, trimContextToFit } from "@/lib/contextManager";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;

    // Get request data
    const { newChat, chatId, generateLearningPath } = await req.json();

    if (!newChat) {
      return NextResponse.json(
        { error: "Missing chat message" },
        { status: 400 }
      );
    }

    // Define interface for chat messages
    interface ChatMessage {
      role: string;
      parts: any;
    }

    let contextHistory: ChatMessage[] = [];

    // Get chat history if chatId is provided
    if (chatId) {
      try {
        await connectToDatabase();
        const chat = await Chat.findOne({ _id: chatId, userId });

        if (chat) {
          // Build context with existing messages
          contextHistory = buildChatContext(chat, newChat);
          // Trim to fit token limits
          contextHistory = trimContextToFit(contextHistory);
        }
      } catch (dbError) {
        console.error("Error retrieving chat history:", dbError);
        // Continue with empty context if DB error occurs
      }
    } else {
      // No chat ID, just use the new message
      contextHistory = [{ role: "user", parts: newChat }];
    }

    // Call the backend API with the payload including userId
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const payload = {
      newChat,
      oldChats: contextHistory,
      generateLearningPath,
      userId, // Add userId for backend context and storage
      chatId,
    };

    const response = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from Gemini API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      answer,
      isLearningPath: generateLearningPath,
      role: "model",
    });
  } catch (error) {
    console.error("Error in Gemini API route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
