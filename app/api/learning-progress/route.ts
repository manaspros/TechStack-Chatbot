import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { LearningProgress } from "@/models/LearningProgress";

// Get all learning paths for a user
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;

    await connectToDatabase();

    // Get all user's learning paths, sorted by last updated
    const learningPaths = await LearningProgress.find({ userId })
      .sort({ updatedAt: -1 })
      .select("-__v")
      .exec();

    return NextResponse.json({ learningPaths });
  } catch (error) {
    console.error("Error fetching learning paths:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning paths" },
      { status: 500 }
    );
  }
}

// Create a new learning path
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { chatId, title, steps } = await req.json();

    if (!chatId || !title || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if learning path already exists for this chat
    let learningPath = await LearningProgress.findOne({ userId, chatId });

    if (learningPath) {
      // Update existing learning path
      learningPath.title = title;
      learningPath.steps = steps.map((step) => ({
        stepId: step.id,
        title: step.title,
        completed: false,
      }));
      learningPath.totalSteps = steps.length;
      learningPath.completedSteps = 0;
      learningPath.isCompleted = false;
      learningPath.updatedAt = new Date();
      learningPath.lastAccessedAt = new Date();

      await learningPath.save();
    } else {
      // Create new learning path
      learningPath = new LearningProgress({
        userId,
        chatId,
        title,
        steps: steps.map((step) => ({
          stepId: step.id,
          title: step.title,
          completed: false,
        })),
        totalSteps: steps.length,
        completedSteps: 0,
      });

      await learningPath.save();
    }

    return NextResponse.json({ learningPath });
  } catch (error) {
    console.error("Error creating learning path:", error);
    return NextResponse.json(
      { error: "Failed to create learning path" },
      { status: 500 }
    );
  }
}
