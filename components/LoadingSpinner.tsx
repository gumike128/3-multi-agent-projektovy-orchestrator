
import React from 'react';

interface LoadingSpinnerProps {
  isLoading: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ isLoading, text = "Spracovávam požiadavku..." }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-80 flex flex-col items-center justify-center z-50 p-4"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      {text && <p className="mt-4 text-lg sm:text-xl text-sky-300 text-center">{text}</p>}
    </div>
  );
});
