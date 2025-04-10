import React, { useState, useEffect } from 'react';
import { LearningStep } from '@/models/LearningProgress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, Edit2, Save } from 'lucide-react';

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
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30';
      case 'practice':
        return 'border-green-500 bg-green-50 dark:bg-green-950/30';
      case 'advanced':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950/30';
      case 'core':
      default:
        return 'border-primary bg-primary-50 dark:bg-primary-950/30';
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
        localErrorMessage && 'border-destructive'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox for completion */}
        <div className="pt-0.5">
          <div 
            onClick={handleToggleComplete}
            className={cn(
              'w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors',
              isUpdating ? 'bg-muted border-muted-foreground' : (
                step.completed 
                  ? 'bg-primary border-primary-foreground text-primary-foreground' 
                  : 'bg-background border-input hover:bg-muted/50'
              ),
              (isLoading || isUpdating) && 'cursor-wait'
            )}
          >
            {isUpdating ? (
              <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : step.completed && (
              <Check className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        
        {/* Step content */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 
              className={cn(
                'text-base font-medium text-foreground',
                step.completed && 'line-through text-muted-foreground'
              )}
            >
              {step.title}
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Category badge */}
              <span className={cn(
                'text-xs px-2 py-1 rounded-full capitalize',
                {
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': step.category === 'prerequisite',
                  'bg-primary/10 text-primary-foreground/80 dark:bg-primary-900/30 dark:text-primary-300': step.category === 'core' || !step.category,
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': step.category === 'practice',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300': step.category === 'advanced',
                }
              )}>
                {step.category || 'core'}
              </span>
            </div>
          </div>
          
          {/* Completion date */}
          {step.completed && step.completedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Completed on {formatCompletionDate()}
            </p>
          )}
          
          {/* Error message */}
          {localErrorMessage && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-destructive mr-1" />
                <p className="text-xs text-destructive">{localErrorMessage}</p>
              </div>
            </div>
          )}
          
          {/* Notes section */}
          <div className="mt-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this step..."
                  className="w-full p-2 text-sm min-h-[80px]"
                  disabled={isSavingNotes}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setNotes(step.notes || '');
                      setIsEditing(false);
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isSavingNotes}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNotes}
                    variant="default"
                    size="sm"
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? (
                      <div className="flex items-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Save className="w-3 h-3 mr-1" />
                        Save Notes
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {step.notes ? (
                  <div className="bg-background/50 p-2 rounded-md text-sm text-foreground">
                    {step.notes}
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 px-2 text-xs"
                      disabled={isSavingNotes}
                    >
                      <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center h-6 px-2"
                    disabled={isSavingNotes}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Add notes
                  </Button>
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