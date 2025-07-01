export type ProgressCallback = (progress: number, message: string) => void;

export class ProgressTracker {
  private steps: string[];
  private currentStep = 0;
  private onProgress: ProgressCallback;

  constructor(steps: string[], onProgress: ProgressCallback) {
    this.steps = steps;
    this.onProgress = onProgress;
  }

  nextStep(message?: string) {
    this.currentStep++;
    const progress = Math.min((this.currentStep / this.steps.length) * 100, 100);
    this.onProgress(progress, message || this.steps[this.currentStep - 1] || '');
  }

  reset() {
    this.currentStep = 0;
    this.onProgress(0, '');
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  getProgress(): number {
    return Math.min((this.currentStep / this.steps.length) * 100, 100);
  }
}

export const DEFAULT_MINIAPP_STEPS = [
  'Initializing mini-app generation...',
  'Validating input...',
  'Optimizing prompt...',
  'Generating code...',
  'Creating mini-app...',
  'Saving result...'
] as const;

export type MiniAppStep = typeof DEFAULT_MINIAPP_STEPS[number];

export function createProgressMessage(step: MiniAppStep, details?: string): string {
  return details ? `${step} ${details}` : step;
}
