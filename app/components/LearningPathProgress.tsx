import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningProgress } from '@/models/LearningProgress';
import { learningService } from '@/utils/learningService';
import { getSessionId, getPathAccessToken } from '@/utils/sessionUtils';
import ProgressBar from './ProgressBar';
import LearningStepItem from './LearningStepItem';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, ArrowLeft } from 'lucide-react';
import Head from 'next/head';

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
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Add state for tracking operations in progress
  const [updatingSteps, setUpdatingSteps] = useState<Set<string>>(new Set());
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});

  // Check for direct access token in URL
  const directAccessToken = searchParams?.get('access_token');

  // Format learning path title to remove redundancy
  const formatPathTitle = (title: string) => {
    if (!title) return '';
    // Remove redundant "Learning Path: " prefix if present
    return title.replace(/^Learning Path: /i, '').replace(/^Learning Path /i, '');
  };

  // Format learning path description to clean it up
  const formatPathDescription = (description: string) => {
    if (!description) return '';
    // Remove "Learning path generated for: " or "Learning path for " prefix if present
    return description
      .replace(/^Learning path generated for: /i, '')
      .replace(/^Learning path for /i, '');
  };

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

  // Update document title when learning path is loaded
  useEffect(() => {
    if (learningPath) {
      document.title = `${formatPathTitle(learningPath.title)} - Learning Path`;
    } else {
      document.title = 'Learning Path';
    }
  }, [learningPath]);

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

  // Handle deletion of the learning path
  const handleDeleteLearningPath = async () => {
    if (!learningPath) return;
    
    setIsDeleting(true);
    
    try {
      await learningService.deleteLearningPath(learningPath._id);
      // Navigate back to learning paths list
      router.push('/learning-paths');
    } catch (err: any) {
      console.error('Error deleting learning path:', err);
      setError(`Failed to delete learning path: ${err.message}`);
      setIsDeleting(false);
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading learning path...</span>
      </div>
    );
  }

  // Error state
  if (error || !learningPath) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6 text-center">
        <div className="text-destructive mb-4 font-medium text-lg">
          {error || 'Failed to load learning path'}
        </div>
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
          <Button 
            onClick={handleRetry}
            variant="default"
          >
            Retry
          </Button>
          <Button
            onClick={() => router.push('/learning-paths')}
            variant="outline"
          >
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  const stepCounts = getStepCounts();
  const categoryCompletion = getCategoryCompletion();
  const filteredSteps = getFilteredSteps();
  
  // Get the properly formatted title
  const formattedTitle = formatPathTitle(learningPath.title);
  const formattedDescription = formatPathDescription(learningPath.description);

  // Render learning path content
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden">
      <Head>
        <title>{formattedTitle} - Learning Path</title>
      </Head>
      {/* Header section */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {formattedTitle}
          </h2>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/learning-paths')}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Learning Path</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this learning path? 
                    This action cannot be undone and all your progress will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteLearningPath}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {formattedDescription && (
          <p className="mt-2 text-muted-foreground">
            {formattedDescription}
          </p>
        )}

        <div className="mt-4">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              Overall Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {learningPath.completedSteps} of {learningPath.totalSteps} steps
            </span>
          </div>
          <ProgressBar 
            progress={learningPath.completedSteps}
            total={learningPath.totalSteps}
            height={8}
            progressColor="bg-primary"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="px-6 py-3 bg-muted/30 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
          
          <Button
            onClick={() => setActiveCategory(null)}
            size="sm"
            variant={activeCategory === null ? "default" : "outline"}
            className="h-7 px-3 py-1 text-xs rounded-full"
          >
            All ({learningPath.totalSteps})
          </Button>
          
          {Object.entries(categoryCompletion).map(([category, { total, completed }]) => (
            <Button
              key={category}
              onClick={() => setActiveCategory(category)}
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              className="h-7 px-3 py-1 text-xs rounded-full flex items-center"
            >
              <span>{category} ({total})</span>
              <span className="ml-1 text-xs">
                {Math.round((completed / total) * 100)}%
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Steps list */}
      <div className="p-6">
        <div className="space-y-4">
          {filteredSteps.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
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