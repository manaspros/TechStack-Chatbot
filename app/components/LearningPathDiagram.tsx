"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  BookOpen,
  Code,
  Lightbulb,
  Zap,
  ChevronDown,
  Loader2,
  Info,
  Plus,
  CheckSquare,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./CustomScrollbar.module.css";
import { learningService } from "@/utils/learningService";
import useProtectedFetch from "@/utils/useProtectedFetch";
import { toast } from "sonner";

// API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/explain-step`
  : "http://localhost:5000/explain-step";

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: "prerequisite" | "core" | "practice" | "advanced";
  completed?: boolean;
  completedAt?: Date;
}

interface LearningPathDiagramProps {
  steps: LearningStep[];
  className?: string;
  enableTracking?: boolean;
  pathId?: string;
  onProgressUpdate?: (completedSteps: number, totalSteps: number) => void;
}

const iconMap = {
  prerequisite: <BookOpen className="h-4 w-4" />,
  core: <Code className="h-4 w-4" />,
  practice: <Zap className="h-4 w-4" />,
  advanced: <Lightbulb className="h-4 w-4" />,
};

const colorMap = {
  prerequisite: "from-blue-600 to-blue-800 border-blue-500",
  core: "from-green-600 to-green-800 border-green-500",
  practice: "from-yellow-600 to-yellow-800 border-yellow-500",
  advanced: "from-purple-600 to-purple-800 border-purple-500",
};

const completedColorMap = {
  prerequisite: "from-blue-800 to-blue-900 border-blue-300",
  core: "from-green-800 to-green-900 border-green-300",
  practice: "from-yellow-800 to-yellow-900 border-yellow-300",
  advanced: "from-purple-800 to-purple-900 border-purple-300",
};

// Safely render text to ensure no markdown or HTML symbols remain
const SafeTextDisplay = ({ text }: { text: string }) => {
  const cleanedText = text
    .replace(/\*/g, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return <span>{cleanedText}</span>;
};

const LearningPathDiagram: React.FC<LearningPathDiagramProps> = ({
  steps,
  className,
  enableTracking = false,
  pathId,
  onProgressUpdate
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [detailedExplanations, setDetailedExplanations] = useState<
    Record<string, string>
  >({});
  const [trackedSteps, setTrackedSteps] = useState<LearningStep[]>(steps);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const { getUserInfo, getToken } = useProtectedFetch();
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID when component mounts if tracking is enabled
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (enableTracking) {
        try {
          const userInfo = await getUserInfo();
          if (userInfo?.sub) {
            setUserId(userInfo.sub);
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    };

    fetchUserInfo();
  }, [enableTracking, getUserInfo]);

  // Update tracked steps whenever input steps change
  useEffect(() => {
    setTrackedSteps(steps);
  }, [steps]);

  const handleToggleDetails = async (stepId: string, stepTitle: string) => {
    if (expandedStepId === stepId) {
      setExpandedStepId(null);
      return;
    }
    if (detailedExplanations[stepId]) {
      setExpandedStepId(stepId);
      return;
    }
    try {
      setLoadingStepId(stepId);
      setExpandedStepId(stepId);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stepId,
          stepTitle,
          stepType: steps.find((step) => step.id === stepId)?.type || "core",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch detailed explanation");
      }
      const data = await response.json();
      setDetailedExplanations((prev) => ({
        ...prev,
        [stepId]: data.explanation,
      }));
    } catch (error) {
      console.error("Error fetching detailed explanation:", error);
      setDetailedExplanations((prev) => ({
        ...prev,
        [stepId]:
          "Sorry, I couldn't fetch a detailed explanation for this step. Please try again later.",
      }));
    } finally {
      setLoadingStepId(null);
    }
  };

  const handleToggleCompletion = async (stepId: string) => {
    if (!enableTracking || !userId || !pathId) {
      toast.error("Progress tracking not available", {
        description: "Please save this learning path first to enable tracking."
      });
      return;
    }

    const step = trackedSteps.find(s => s.id === stepId);
    if (!step) return;

    try {
      setUpdatingStepId(stepId);
      const newCompletionStatus = !step.completed;
      
      // Optimistic UI update
      const updatedSteps = trackedSteps.map(s => 
        s.id === stepId ? { ...s, completed: newCompletionStatus } : s
      );
      setTrackedSteps(updatedSteps);
      
      // Update step completion status on the server
      await learningService.updateStepCompletion(
        pathId,
        stepId,
        newCompletionStatus,
        userId
      );
      
      // Calculate and pass the updated progress if callback is provided
      if (onProgressUpdate) {
        const completedCount = updatedSteps.filter(s => s.completed).length;
        onProgressUpdate(completedCount, updatedSteps.length);
      }
      
      toast.success(
        newCompletionStatus ? "Step marked as completed" : "Step marked as incomplete",
        { duration: 2000 }
      );
    } catch (error) {
      console.error("Error updating step completion status:", error);
      
      // Revert the optimistic update
      setTrackedSteps(steps);
      
      toast.error("Failed to update progress", {
        description: "Please try again later"
      });
    } finally {
      setUpdatingStepId(null);
    }
  };

  return (
    <div className={cn("w-full my-6 px-2", className)}>
      <div className="relative">
        {trackedSteps.map((step, index) => {
          const isStepCompleted = step.completed === true;
          
          return (
          <div key={step.id} className="flex flex-col mb-8 relative">
            {/* Node and content container */}
            <motion.div
              className="flex items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Step node */}
              <div
                className={cn(
                  "min-w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br border-2 shadow-lg text-white font-bold",
                  isStepCompleted 
                    ? completedColorMap[step.type] 
                    : colorMap[step.type]
                )}
              >
                {iconMap[step.type]}
              </div>
              
              {/* Content with safe text display and detail expansion */}
              <div className={cn(
                "ml-4 bg-gray-900 p-3 rounded-md flex-grow border-l-2",
                isStepCompleted 
                  ? "border-green-600 bg-gray-900/90" 
                  : "border-gray-700"
              )}>
                <div className="flex justify-between items-center">
                  <h3
                    className={cn(
                      "font-bold",
                      step.type === "prerequisite"
                        ? "text-blue-400"
                        : step.type === "core"
                        ? "text-green-400"
                        : step.type === "practice"
                        ? "text-yellow-400"
                        : "text-purple-400"
                    )}
                  >
                    <SafeTextDisplay text={step.title} />
                  </h3>
                  
                  {/* Completion checkbox (if tracking is enabled) */}
                  {enableTracking && (
                    <button
                      onClick={() => handleToggleCompletion(step.id)}
                      disabled={updatingStepId === step.id}
                      className={cn(
                        "ml-2 p-1 rounded hover:bg-gray-800 transition-colors",
                        updatingStepId === step.id && "opacity-50 cursor-wait"
                      )}
                      title={isStepCompleted ? "Mark as incomplete" : "Mark as completed"}
                    >
                      {isStepCompleted ? (
                        <CheckSquare className="h-5 w-5 text-green-400" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                
                <p className="text-xs mt-1 text-gray-300">
                  <SafeTextDisplay text={step.description} />
                </p>
                
                {/* Completion status (if tracking is enabled and step is completed) */}
                {enableTracking && isStepCompleted && step.completedAt && (
                  <div className="mt-2 text-xs text-green-400">
                    Completed on {new Date(step.completedAt).toLocaleDateString()}
                  </div>
                )}
                
                {/* "Learn More" button with clear visual cue */}
                <button
                  onClick={() => handleToggleDetails(step.id, step.title)}
                  className={cn(
                    "mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors",
                    expandedStepId === step.id
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-800 hover:bg-gray-700 text-purple-300 hover:text-purple-200 border border-gray-700 hover:border-gray-600",
                    "group"
                  )}
                  aria-expanded={expandedStepId === step.id}
                >
                  {loadingStepId === step.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading explanation...</span>
                    </>
                  ) : expandedStepId === step.id ? (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 transform rotate-180" />
                      <span>Hide explanation</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      <span>Learn more about this step</span>
                      <Plus className="h-3 w-3 ml-1 text-purple-400 group-hover:rotate-90 transition-transform" />
                    </>
                  )}
                </button>
                
                {/* Detailed explanation section - with custom scrollbar */}
                <AnimatePresence>
                  {expandedStepId === step.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        {loadingStepId === step.id ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-400">
                              Generating explanation...
                            </span>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "text-xs text-gray-200 leading-relaxed bg-gray-800 p-3 rounded-md border-l-2 border-purple-500",
                              // Apply max height and custom scrollbar when content is long
                              detailedExplanations[step.id] &&
                                detailedExplanations[step.id].length > 400 &&
                                "max-h-[200px] overflow-y-auto",
                              styles.customScrollbar
                            )}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  detailedExplanations[step.id] ||
                                  "Loading explanation...",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            {/* Arrow to next step */}
            {index < trackedSteps.length - 1 && (
              <motion.div
                className="absolute left-6 top-12 h-8 flex items-center justify-center -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <div className="w-0.5 h-full bg-gray-600 rounded-full"></div>
                <ChevronRight className="absolute bottom-0 text-gray-400 -translate-x-1/2 translate-y-3" />
              </motion.div>
            )}
          </div>
        )})}
      </div>
      
      {/* Help text for the diagram */}
      <div className="flex items-center justify-center mt-2 mb-1 space-x-4">
        <p className="text-xs text-gray-500 italic flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>
            Click on "Learn more" for detailed explanations about each step
          </span>
        </p>
        
        {enableTracking && (
          <p className="text-xs text-green-500 italic flex items-center">
            <CheckSquare className="h-3 w-3 mr-1" />
            <span>
              Click the checkbox to mark steps as completed
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LearningPathDiagram;
