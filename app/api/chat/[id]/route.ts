import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat } from "@/models/Chat";
import mongoose from "mongoose";

// Helper function to validate MongoDB ObjectId with better error reporting
function isValidObjectId(id: string): { valid: boolean; reason?: string } {
  if (!id) {
    return { valid: false, reason: "ID is undefined or empty" };
  }

  if (typeof id !== "string") {
    return { valid: false, reason: `ID is not a string: ${typeof id}` };
  }

  if (id.length !== 24) {
    return {
      valid: false,
      reason: `ID length is incorrect: ${id.length}, should be 24`,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      valid: false,
      reason: "ID format is invalid for MongoDB ObjectId",
    };
  }

  return { valid: true };
}

// Get a specific chat by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demonstration, extract userId from headers
    // In production, this would be set by middleware after validating the Auth0 session
    const userId = req.headers.get("x-user-id") || "demo-user";

    const { id } = params;
    console.log(`API: Received request for chat ID: "${id}"`);

    // Enhanced validation with better error reporting
    const validationResult = isValidObjectId(id);
    if (!validationResult.valid) {
      console.error(
        `Invalid chat ID rejected: ${id}, reason: ${validationResult.reason}`
      );
      return NextResponse.json(
        {
          error: "Invalid chat ID format",
          details: validationResult.reason,
        },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Try to find the chat with a valid ObjectId
    try {
      const chat = await Chat.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId,
      });

      if (!chat) {
        console.log(`Chat not found for ID: ${id} and userId: ${userId}`);
        return NextResponse.json(
          { error: "Chat not found or unauthorized" },
          { status: 404 }
        );
      }

      return NextResponse.json({ chat });
    } catch (mongoError) {
      console.error(`MongoDB error when querying for chat ${id}:`, mongoError);
      return NextResponse.json(
        {
          error: "Database query error",
          details: (mongoError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

// Delete a chat - Similar updates for the DELETE method
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For demonstration, extract userId from headers
    // In production, this would be set by middleware after validating the Auth0 session
    const userId = req.headers.get("x-user-id") || "demo-user";

    const { id } = params;

    // Enhanced validation with better error reporting
    const validationResult = isValidObjectId(id);
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: "Invalid chat ID format",
          details: validationResult.reason,
        },
        { status: 400 }
      );
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const result = await Chat.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Chat not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
