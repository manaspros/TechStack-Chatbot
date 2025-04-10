export interface LearningStep {
  stepId: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  category?: 'prerequisite' | 'core' | 'practice' | 'advanced';
}

export interface LearningProgress {
  _id: string;
  userId: string;
  chatId: string;
  title: string;
  description?: string;
  steps: LearningStep[];
  totalSteps: number;
  completedSteps: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  isCompleted: boolean;
  estimatedTimeToComplete?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}