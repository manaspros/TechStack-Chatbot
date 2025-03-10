import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { LearningProgress } from "@/models/LearningProgress";
import mongoose from "mongoose";

// Get a specific learning path
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid learning path ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const learningPath = await LearningProgress.findOne({
      _id: id,
      userId,
    });

    if (!learningPath) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    // Update last accessed timestamp
    learningPath.lastAccessedAt = new Date();
    await learningPath.save();

    return NextResponse.json({ learningPath });
  } catch (error) {
    console.error("Error fetching learning path:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning path" },
      { status: 500 }
    );
  }
}

// Update learning progress (mark steps as completed)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id } = params;
    const { stepId, completed } = await req.json();

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid learning path ID" },
        { status: 400 }
      );
    }

    if (!stepId) {
      return NextResponse.json(
        { error: "Step ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const learningPath = await LearningProgress.findOne({
      _id: id,
      userId,
    });

    if (!learningPath) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    // Find the step and update its completion status
    const stepIndex: number = learningPath.steps.findIndex(
      (s: { stepId: string }) => s.stepId === stepId
    );

    if (stepIndex === -1) {
      return NextResponse.json(
        { error: "Step not found in learning path" },
        { status: 404 }
      );
    }

    // Update the step completion status
    const step = learningPath.steps[stepIndex];
    const wasCompleted = step.completed;
    step.completed = completed;

    // Update completion timestamp if newly completed
    if (completed && !wasCompleted) {
      step.completedAt = new Date();
      learningPath.completedSteps += 1;
    } else if (!completed && wasCompleted) {
      step.completedAt = undefined;
      learningPath.completedSteps -= 1;
    }

    // Check if all steps are completed
    learningPath.isCompleted =
      learningPath.completedSteps === learningPath.totalSteps;

    // Update timestamps
    learningPath.updatedAt = new Date();
    learningPath.lastAccessedAt = new Date();

    await learningPath.save();

    return NextResponse.json({
      success: true,
      learningPath,
    });
  } catch (error) {
    console.error("Error updating learning path:", error);
    return NextResponse.json(
      { error: "Failed to update learning path" },
      { status: 500 }
    );
  }
}

// Delete a learning path
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid learning path ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await LearningProgress.deleteOne({
      _id: id,
      userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Learning path not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Learning path deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting learning path:", error);
    return NextResponse.json(
      { error: "Failed to delete learning path" },
      { status: 500 }
    );
  }
}
