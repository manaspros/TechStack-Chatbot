"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  BookOpen,
  Code,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Trophy,
  Info,
} from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import LearningProgressTracker from "@/components/LearningProgressTracker";

type StepType = "prerequisite" | "core" | "practice" | "advanced";

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
}

interface LearningPathDiagramProps {
  steps: LearningStep[];
  chatId?: string;
}

export default function LearningPathDiagram({
  steps = [],
  chatId,
}: LearningPathDiagramProps) {
  const { user } = useUser();
  const [selectedStep, setSelectedStep] = useState<LearningStep | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Sort steps by type for better visualization
  const sortedSteps = [...steps].sort((a, b) => {
    const typeOrder = {
      prerequisite: 0,
      core: 1,
      practice: 2,
      advanced: 3,
    };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  // Function to get step icon based on type
  const getStepIcon = (type: StepType) => {
    switch (type) {
      case "prerequisite":
        return <Lightbulb className="h-5 w-5 text-yellow-400" />;
      case "core":
        return <BookOpen className="h-5 w-5 text-blue-400" />;
      case "practice":
        return <Code className="h-5 w-5 text-green-400" />;
      case "advanced":
        return <Zap className="h-5 w-5 text-purple-400" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Function to get step color based on type
  const getStepColor = (type: StepType) => {
    switch (type) {
      case "prerequisite":
        return "border-yellow-500/40 bg-yellow-900/20";
      case "core":
        return "border-blue-500/40 bg-blue-900/20";
      case "practice":
        return "border-green-500/40 bg-green-900/20";
      case "advanced":
        return "border-purple-500/40 bg-purple-900/20";
      default:
        return "border-gray-500/40 bg-gray-800/20";
    }
  };

  // Function to get explanation for a step using backend API
  const getStepExplanation = async (step: LearningStep) => {
    try {
      setSelectedStep(step);
      setIsLoading(true);
      setExplanationText(null);

      const response = await fetch("/api/explain-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stepId: step.id,
          stepTitle: step.title,
          stepType: step.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      setExplanationText(data.explanation);
    } catch (error) {
      console.error("Error fetching step explanation:", error);
      setExplanationText("Sorry, couldn't load the explanation for this step.");
    } finally {
      setIsLoading(false);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="py-4 px-6 text-center border border-gray-700 bg-gray-800/50 rounded-lg">
        <AlertCircle className="mx-auto h-8 w-8 text-yellow-400 mb-2" />
        <p className="text-yellow-300">No learning steps could be extracted.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress tracker toggle */}
      {user && chatId && (
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-md text-sm text-blue-300 transition-colors"
        >
          {showProgress ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Trophy className="h-4 w-4" />
          )}
          {showProgress ? "Hide Progress Tracker" : "Track Your Progress"}
        </button>
      )}

      {/* Progress tracker if enabled */}
      {showProgress && user && chatId && (
        <LearningProgressTracker chatId={chatId} steps={steps} />
      )}

      {/* Learning path legend */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Prerequisites</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Core Concepts</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Practice</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Advanced</span>
        </div>
      </div>

      {/* Learning path diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {sortedSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`border rounded-md p-3 cursor-pointer hover:shadow-md transition-all ${getStepColor(
              step.type
            )} ${
              selectedStep?.id === step.id
                ? "ring-2 ring-opacity-50 ring-white"
                : ""
            }`}
            onClick={() => getStepExplanation(step)}
          >
            <div className="flex items-start gap-2">
              <div className="mt-1">{getStepIcon(step.type)}</div>
              <div>
                <h4 className="text-sm font-semibold">{step.title}</h4>
                {step.description && (
                  <p className="text-xs opacity-60 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Step explanation area */}
      {selectedStep && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={`border rounded-lg p-4 mb-4 ${getStepColor(
            selectedStep.type
          )}`}
        >
          <h3 className="font-bold flex items-center gap-2 mb-3">
            {getStepIcon(selectedStep.type)}
            <span>{selectedStep.title}</span>
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-pulse flex gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animation-delay-200"></div>
                <div className="h-2 w-2 rounded-full bg-gray-400 animation-delay-400"></div>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-line">
              {explanationText ? (
                <div dangerouslySetInnerHTML={{ __html: explanationText }} />
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <Info className="h-4 w-4" />
                  <span>Click on a step to see detailed explanation</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
