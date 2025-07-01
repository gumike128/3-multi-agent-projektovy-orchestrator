
import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { UI_STRINGS } from '@/constants';

interface ErrorMessageProps {
  message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = React.memo(({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div 
      className="bg-red-700 border border-red-900 text-red-100 px-4 py-3 rounded-lg shadow-md relative my-4" 
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-6 w-6 text-red-300 mr-3 flex-shrink-0" />
        <div>
          <strong className="font-bold">{UI_STRINGS.errorOccurred}: </strong>
          <span className="block sm:inline">{message}</span>
        </div>
      </div>
    </div>
  );
});
