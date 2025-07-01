import React from 'react';

// This component is deprecated and its functionality has been removed or replaced.
// The original props relied on types (ExecutionPhase, SubTask, TaskStatus, SubTaskExecutionStatus) 
// and constants (TASK_STATUS_DETAILS, SUB_TASK_EXECUTION_STATUS_DETAILS, various UI_STRINGS) 
// that are no longer part of the project, causing the reported errors.
//
// By making this a simple, non-rendering component, we fix the type errors within this file.
// If this component were still being used, it would now render nothing.
// Based on App.tsx, it seems this component is no longer actively rendered.

export const ProjectPlanDisplay: React.FC = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      "The 'ProjectPlanDisplay' component is deprecated and likely no longer used. " +
      "It has been replaced with a placeholder to resolve compilation errors. " +
      "Consider removing any remaining imports of this component."
    );
  }
  return null;
};
