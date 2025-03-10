"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./CustomScrollbar.module.css";

// API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/explain-step`
  : "http://localhost:5000/explain-step";

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: "prerequisite" | "core" | "practice" | "advanced";
}

interface LearningPathDiagramProps {
  steps: LearningStep[];
  className?: string;
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
}) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null);
  const [detailedExplanations, setDetailedExplanations] = useState<
    Record<string, string>
  >({});

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

  return (
    <div className={cn("w-full my-6 px-2", className)}>
      <div className="relative">
        {steps.map((step, index) => (
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
                  colorMap[step.type]
                )}
              >
                {iconMap[step.type]}
              </div>

              {/* Content with safe text display and detail expansion */}
              <div className="ml-4 bg-gray-900 p-3 rounded-md flex-grow border-l-2 border-gray-700">
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
                </div>

                <p className="text-xs mt-1 text-gray-300">
                  <SafeTextDisplay text={step.description} />
                </p>

                {/* NEW: "Learn More" button with clear visual cue */}
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
            {index < steps.length - 1 && (
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
        ))}
      </div>

      {/* NEW: Help text for the diagram */}
      <div className="flex items-center justify-center mt-2 mb-1">
        <p className="text-xs text-gray-500 italic flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>
            Click on "Learn more" for detailed explanations about each step
          </span>
        </p>
      </div>
    </div>
  );
};

export default LearningPathDiagram;
