"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  BookOpen,
  BarChart,
  CheckSquare,
  Square,
  Loader2,
  Award,
} from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LearningStep {
  stepId: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

interface LearningProgressProps {
  chatId: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
  }>;
}

export default function LearningProgressTracker({
  chatId,
  steps,
}: LearningProgressProps) {
  const { user } = useUser();
  const [progress, setProgress] = useState<{
    learningPath: {
      _id: string;
      steps: LearningStep[];
      totalSteps: number;
      completedSteps: number;
      title: string;
      isCompleted: boolean;
    } | null;
    isLoading: boolean;
    error: string | null;
  }>({
    learningPath: null,
    isLoading: true,
    error: null,
  });

  // Fetch initial progress data
  useEffect(() => {
    const fetchProgress = async () => {
      if (!chatId || !user?.sub || steps.length === 0) return;

      try {
        setProgress((prev) => ({ ...prev, isLoading: true, error: null }));

        // Try to get existing learning path first
        const response = await fetch(`/api/learning-progress?chatId=${chatId}`);

        if (response.ok) {
          const data = await response.json();

          if (data.learningPaths && data.learningPaths.length > 0) {
            // Found existing learning path
            setProgress({
              learningPath: data.learningPaths[0],
              isLoading: false,
              error: null,
            });
            return;
          }
        }

        // If no existing path found, create a new one
        const createResponse = await fetch("/api/learning-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            title: `Learning Path: ${steps[0].title}`,
            steps,
          }),
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          setProgress({
            learningPath: createData.learningPath,
            isLoading: false,
            error: null,
          });
        } else {
          throw new Error("Failed to create learning path");
        }
      } catch (err) {
        console.error("Error loading learning progress:", err);
        setProgress({
          learningPath: null,
          isLoading: false,
          error: "Failed to load learning progress",
        });
      }
    };

    fetchProgress();
  }, [chatId, steps, user?.sub]);

  // Handle step toggle
  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    if (!progress.learningPath?._id || !user?.sub) return;

    try {
      // Optimistically update UI
      setProgress((prev) => {
        if (!prev.learningPath) return prev;

        const updatedSteps = prev.learningPath.steps.map((step) =>
          step.stepId === stepId ? { ...step, completed: !currentStatus } : step
        );

        const completedCount = updatedSteps.filter((s) => s.completed).length;

        return {
          ...prev,
          learningPath: {
            ...prev.learningPath,
            steps: updatedSteps,
            completedSteps: completedCount,
            isCompleted: completedCount === prev.learningPath.totalSteps,
          },
        };
      });

      // Update on server
      const response = await fetch(
        `/api/learning-progress/${progress.learningPath._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepId,
            completed: !currentStatus,
            userId: user.sub,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update progress");
      }

      // Show success toast when marking complete
      if (!currentStatus) {
        toast.success("Progress updated", {
          description: "Your learning path progress has been saved.",
        });
      }
    } catch (err) {
      console.error("Error updating step:", err);
      toast.error("Failed to update progress", {
        description: "Please try again",
      });

      // Revert optimistic update on error by refetching current state
      const response = await fetch(
        `/api/learning-progress/${progress.learningPath._id}`
      );
      if (response.ok) {
        const data = await response.json();
        setProgress((prev) => ({
          ...prev,
          learningPath: data.learningPath,
        }));
      }
    }
  };

  // Calculate progress percentage
  const progressPercent = progress.learningPath
    ? Math.round(
        (progress.learningPath.completedSteps /
          progress.learningPath.totalSteps) *
          100
      )
    : 0;

  if (progress.isLoading) {
    return (
      <div className="flex items-center justify-center p-4 mt-4 bg-gray-800/30 rounded-lg border border-green-500/20">
        <Loader2 className="h-5 w-5 animate-spin text-green-400 mr-2" />
        <span className="text-sm text-green-400">Loading progress...</span>
      </div>
    );
  }

  if (progress.error || !progress.learningPath) {
    return null;
  }

  return (
    <div className="bg-gray-800/60 rounded-lg border border-green-500/30 p-4 my-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 text-green-400 mr-2" />
          <h3 className="font-bold text-green-400">Learning Progress</h3>
        </div>

        <div className="flex items-center text-sm">
          <span className="text-gray-300 mr-2">
            {progress.learningPath.completedSteps} of{" "}
            {progress.learningPath.totalSteps} steps
          </span>
          <span
            className={cn(
              "font-bold",
              progressPercent === 100 ? "text-green-400" : "text-blue-400"
            )}
          >
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-700 rounded-full mb-4">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            progressPercent === 100 ? "bg-green-500" : "bg-blue-500"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {progress.learningPath.isCompleted && (
        <div className="flex items-center justify-center gap-2 mb-4 bg-green-900/30 p-3 rounded-md border border-green-500/20">
          <Award className="h-5 w-5 text-green-400" />
          <p className="font-semibold text-green-400">
            Congratulations! You've completed all steps!
          </p>
        </div>
      )}

      {/* Step list */}
      <div className="space-y-2 mt-6">
        {progress.learningPath.steps.map((step) => (
          <div
            key={step.stepId}
            onClick={() => handleToggleStep(step.stepId, step.completed)}
            className="flex items-center hover:bg-gray-700/30 p-2 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0 mr-3">
              {step.completed ? (
                <CheckSquare className="h-5 w-5 text-green-400" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="flex-grow">
              <p
                className={cn(
                  "text-sm",
                  step.completed
                    ? "text-green-300 line-through"
                    : "text-gray-300"
                )}
              >
                {step.title}
              </p>

              {step.completedAt && (
                <p className="text-xs text-green-500/60">
                  Completed {new Date(step.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
