import mongoose, { Schema, Document } from "mongoose";

export interface ILearningStep {
  stepId: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface ILearningProgress extends Document {
  userId: string;
  chatId: mongoose.Schema.Types.ObjectId;
  title: string;
  steps: ILearningStep[];
  totalSteps: number;
  completedSteps: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  isCompleted: boolean;
}

const LearningStepSchema = new Schema<ILearningStep>({
  stepId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
});

const LearningProgressSchema = new Schema<ILearningProgress>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  steps: [LearningStepSchema],
  totalSteps: {
    type: Number,
    required: true,
  },
  completedSteps: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

// Indexes for efficient queries
LearningProgressSchema.index({ userId: 1, chatId: 1 }, { unique: true });
LearningProgressSchema.index({ userId: 1, updatedAt: -1 });

export const LearningProgress =
  mongoose.models.LearningProgress ||
  mongoose.model<ILearningProgress>("LearningProgress", LearningProgressSchema);
