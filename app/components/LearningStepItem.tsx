import React, { useState, useEffect } from 'react';
import { LearningStep } from '@/models/LearningProgress';
import { cn } from '@/lib/utils';

interface LearningStepItemProps {
  step: LearningStep;
  onToggleComplete: (stepId: string, completed: boolean) => Promise<void>;
  onAddNotes: (stepId: string, notes: string) => Promise<void>;
  isLoading?: boolean;
  isUpdating?: boolean;
  isSavingNotes?: boolean;
  errorMessage?: string;
}

/**
 * LearningStepItem component to display and interact with a learning step
 */
const LearningStepItem: React.FC<LearningStepItemProps> = ({
  step,
  onToggleComplete,
  onAddNotes,
  isLoading = false,
  isUpdating = false,
  isSavingNotes = false,
  errorMessage = '',
}) => {
  const [notes, setNotes] = useState(step.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState('');
  
  // Update notes state when step.notes changes
  useEffect(() => {
    setNotes(step.notes || '');
  }, [step.notes]);
  
  // Display error message from props and clear after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      setLocalErrorMessage(errorMessage);
      const timer = setTimeout(() => {
        setLocalErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Get the appropriate category style
  const getCategoryStyle = () => {
    switch (step.category) {
      case 'prerequisite':
        return 'border-blue-300 bg-blue-50';
      case 'practice':
        return 'border-green-300 bg-green-50';
      case 'advanced':
        return 'border-purple-300 bg-purple-50';
      case 'core':
      default:
        return 'border-cyan-300 bg-cyan-50';
    }
  };

  // Handle toggling step completion
  const handleToggleComplete = async () => {
    if (isLoading || isUpdating) return;
    await onToggleComplete(step.stepId, !step.completed);
  };

  // Handle saving notes
  const handleSaveNotes = async () => {
    if (notes.trim() === step.notes?.trim()) {
      setIsEditing(false);
      return;
    }
    
    try {
      await onAddNotes(step.stepId, notes);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  // Format completion date if available
  const formatCompletionDate = () => {
    if (!step.completedAt) return null;
    const date = new Date(step.completedAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div 
      className={cn(
        'p-4 rounded-lg border-l-4 shadow-sm',
        getCategoryStyle(),
        step.completed ? 'border-opacity-100' : 'border-opacity-50',
        (isLoading || isUpdating) && 'opacity-70',
        localErrorMessage && 'border-red-300'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for completion */}
        <div className="pt-0.5">
          <div 
            onClick={handleToggleComplete}
            className={cn(
              'w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors',
              isUpdating ? 'bg-gray-200 border-gray-300' : (
                step.completed 
                  ? 'bg-cyan-500 border-cyan-600 text-white' 
                  : 'bg-white border-gray-300 hover:bg-gray-100'
              ),
              (isLoading || isUpdating) && 'cursor-wait'
            )}
          >
            {isUpdating ? (
              <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            ) : step.completed && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                fill="currentColor" 
                viewBox="0 0 16 16"
              >
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
            )}
          </div>
        </div>
        
        {/* Step content */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 
              className={cn(
                'text-base font-medium text-gray-800',
                step.completed && 'line-through text-gray-500'
              )}
            >
              {step.title}
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Category badge */}
              <span className={cn(
                'text-xs px-2 py-1 rounded-full capitalize',
                {
                  'bg-blue-100 text-blue-800': step.category === 'prerequisite',
                  'bg-cyan-100 text-cyan-800': step.category === 'core' || !step.category,
                  'bg-green-100 text-green-800': step.category === 'practice',
                  'bg-purple-100 text-purple-800': step.category === 'advanced',
                }
              )}>
                {step.category || 'core'}
              </span>
            </div>
          </div>
          
          {/* Completion date */}
          {step.completed && step.completedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Completed on {formatCompletionDate()}
            </p>
          )}
          
          {/* Error message */}
          {localErrorMessage && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-600">{localErrorMessage}</p>
            </div>
          )}
          
          {/* Notes section */}
          <div className="mt-3">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this step..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm min-h-[80px]"
                  disabled={isSavingNotes}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNotes(step.notes || '');
                      setIsEditing(false);
                    }}
                    className="px-3 py-1 text-xs rounded-md border border-gray-300 bg-white hover:bg-gray-100"
                    disabled={isSavingNotes}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md",
                      isSavingNotes 
                        ? "bg-gray-400 text-white" 
                        : "bg-cyan-500 text-white hover:bg-cyan-600"
                    )}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        Saving...
                      </div>
                    ) : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {step.notes ? (
                  <div className="bg-white bg-opacity-50 p-2 rounded-md text-sm text-gray-700">
                    {step.notes}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-2 text-xs text-cyan-600 hover:text-cyan-800 underline"
                      disabled={isSavingNotes}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    disabled={isSavingNotes}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                      <path
                        fillRule="evenodd"
                        d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                      />
                    </svg>
                    Add notes
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStepItem;