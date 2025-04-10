import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningProgress } from '@/models/LearningProgress';
import { learningService } from '@/utils/learningService';
import { getSessionId, getPathAccessToken } from '@/utils/sessionUtils';
import ProgressBar from './ProgressBar';
import LearningStepItem from './LearningStepItem';

interface LearningPathProgressProps {
  progressId: string;
  userId?: string; // Make userId optional
}

/**
 * LearningPathProgress component for displaying and managing a learning path
 * Modified to work without requiring user authentication
 */
const LearningPathProgress: React.FC<LearningPathProgressProps> = ({
  progressId,
  userId,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [learningPath, setLearningPath] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Add state for tracking operations in progress
  const [updatingSteps, setUpdatingSteps] = useState<Set<string>>(new Set());
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});

  // Check for direct access token in URL
  const directAccessToken = searchParams?.get('access_token');

  // Simplified authentication - no Auth0 dependency
  useEffect(() => {
    const loadLearningPath = async () => {
      if (!progressId) {
        setError("Missing learning path ID.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        console.log(`Attempting to load learning path: ${progressId}`);

        // If we have a direct access token in the URL, try using that first
        if (directAccessToken) {
          try {
            const result = await learningService.getLearningPathByToken(progressId, directAccessToken);
            if (result && result.learningPath) {
              setLearningPath(result.learningPath);
              setError(null);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Direct token access failed, falling back to other methods:", e);
          }
        }

        // Use the main getLearningPath which tries multiple approaches internally
        const result = await learningService.getLearningPath(progressId);

        if (result && result.learningPath) {
          setLearningPath(result.learningPath);
          setError(null);
        } else {
          throw new Error("Could not retrieve learning path data");
        }
      } catch (err: any) {
        console.error('Error loading learning path:', err);
        setError(err.message || 'Failed to load learning path');
      } finally {
        setLoading(false);
      }
    };

    loadLearningPath();
  }, [progressId, retryCount, directAccessToken]);

  // Handle step completion toggle with improved error handling
  const handleToggleComplete = async (stepId: string, completed: boolean) => {
    if (!learningPath) return;

    // Add step to updating set to show loading indicator
    setUpdatingSteps(prev => new Set([...prev, stepId]));

    // Clear any previous errors for this step
    setErrorMessages(prev => ({ ...prev, [stepId]: '' }));

    try {
      const result = await learningService.updateStepCompletion(
        learningPath._id,
        stepId,
        completed
      );

      setLearningPath(result.learningPath);
    } catch (err: any) {
      console.error('Error updating step completion:', err);

      // Set specific error for this step
      setErrorMessages(prev => ({
        ...prev,
        [stepId]: "Couldn't save your progress. Please try again."
      }));

      // Revert the UI state back since the save failed
      setLearningPath(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map(s =>
            s.stepId === stepId ? { ...s, completed: !completed } : s
          )
        };
      });
    } finally {
      // Remove step from updating set
      setUpdatingSteps(prev => {
        const next = new Set([...prev]);
        next.delete(stepId);
        return next;
      });
    }
  };

  // Handle adding notes to a step with improved error handling
  const handleAddNotes = async (stepId: string, notes: string) => {
    if (!learningPath) return;

    // Add step to saving notes set
    setSavingNotes(prev => new Set([...prev, stepId]));

    // Clear any previous errors for this step
    setErrorMessages(prev => ({ ...prev, [stepId]: '' }));

    try {
      const result = await learningService.addStepNotes(
        learningPath._id,
        stepId,
        notes
      );

      setLearningPath(result.learningPath);
    } catch (err: any) {
      console.error('Error adding notes:', err);

      // Set specific error for this step
      setErrorMessages(prev => ({
        ...prev,
        [stepId]: "Couldn't save your notes. Please try again."
      }));
    } finally {
      // Remove step from saving notes set
      setSavingNotes(prev => {
        const next = new Set([...prev]);
        next.delete(stepId);
        return next;
      });
    }
  };

  // Get steps filtered by category if a category is selected
  const getFilteredSteps = () => {
    if (!learningPath) return [];
    if (!activeCategory) return learningPath.steps;

    return learningPath.steps.filter(step => step.category === activeCategory);
  };

  // Count steps by category
  const getStepCounts = () => {
    if (!learningPath) return {};

    return learningPath.steps.reduce((counts: Record<string, number>, step) => {
      const category = step.category || 'core';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
  };

  // Calculate completion percentage for each category
  const getCategoryCompletion = () => {
    if (!learningPath) return {};

    const categorySteps: Record<string, { total: number, completed: number }> = {};

    learningPath.steps.forEach(step => {
      const category = step.category || 'core';

      if (!categorySteps[category]) {
        categorySteps[category] = { total: 0, completed: 0 };
      }

      categorySteps[category].total += 1;
      if (step.completed) {
        categorySteps[category].completed += 1;
      }
    });

    return categorySteps;
  };

  // Handle retry button
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading learning path...</span>
      </div>
    );
  }

  // Error state
  if (error || !learningPath) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-red-500 mb-4 font-medium text-lg">
          {error || 'Failed to load learning path'}
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/learning-paths')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Learning Paths
          </button>
        </div>
      </div>
    );
  }

  const stepCounts = getStepCounts();
  const categoryCompletion = getCategoryCompletion();
  const filteredSteps = getFilteredSteps();

  // Render learning path content
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">{learningPath.title}</h2>

        {learningPath.description && (
          <p className="mt-2 text-gray-600">{learningPath.description}</p>
        )}

        <div className="mt-4">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-gray-500">
              {learningPath.completedSteps} of {learningPath.totalSteps} steps
            </span>
          </div>
          <ProgressBar
            progress={learningPath.completedSteps}
            total={learningPath.totalSteps}
            height={8}
            progressColor="bg-blue-500"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Filter:</span>

          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 text-sm rounded-full ${
              activeCategory === null
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All ({learningPath.totalSteps})
          </button>

          {Object.entries(categoryCompletion).map(([category, { total, completed }]) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 text-sm rounded-full flex items-center ${
                activeCategory === category
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <span>{category} ({total})</span>
              <span className="ml-1 text-xs">
                {Math.round((completed / total) * 100)}%
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Steps list */}
      <div className="p-6">
        <div className="space-y-4">
          {filteredSteps.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No steps found in this category.
            </p>
          ) : (
            filteredSteps.map((step) => (
              <LearningStepItem
                key={step.stepId}
                step={step}
                onToggleComplete={handleToggleComplete}
                onAddNotes={handleAddNotes}
                isUpdating={updatingSteps.has(step.stepId)}
                isSavingNotes={savingNotes.has(step.stepId)}
                errorMessage={errorMessages[step.stepId] || ''}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathProgress;