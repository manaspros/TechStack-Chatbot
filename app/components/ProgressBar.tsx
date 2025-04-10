import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  total: number;
  showPercentage?: boolean;
  height?: number;
  className?: string;
  progressColor?: string;
  bgColor?: string;
  animate?: boolean;
}

/**
 * ProgressBar component to visualize completion progress
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  showPercentage = true,
  height = 8,
  className = '',
  progressColor = 'bg-cyan-500',
  bgColor = 'bg-slate-200',
  animate = true,
}) => {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;
  
  return (
    <div className={cn('w-full flex flex-col gap-1', className)}>
      <div 
        className={cn('w-full rounded-full overflow-hidden', bgColor)} 
        style={{ height: `${height}px` }}
      >
        <div 
          className={cn(
            'h-full', 
            progressColor,
            animate && 'transition-all duration-300 ease-out'
          )} 
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      {showPercentage && (
        <div className="text-xs text-slate-600 flex justify-between">
          <span>{progress} of {total} completed</span>
          <span className="font-medium">{percentage}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;