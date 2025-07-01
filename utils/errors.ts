export type ErrorCode = 'API_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR';

export class MiniAppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'MiniAppError';
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MiniAppError.prototype);
  }

  static isRetryable(error: unknown): error is MiniAppError {
    return error instanceof MiniAppError && error.retryable;
  }

  static fromUnknown(error: unknown, defaultMessage = 'An unknown error occurred'): MiniAppError {
    if (error instanceof MiniAppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new MiniAppError(error.message, 'API_ERROR', false);
    }

    if (typeof error === 'string') {
      return new MiniAppError(error, 'API_ERROR', false);
    }

    return new MiniAppError(defaultMessage, 'API_ERROR', false);
  }
}

export class ValidationError extends MiniAppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NetworkError extends MiniAppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
