import { useEffect, useRef } from 'react';

export function useAsyncCleanup() {
  const abortController = useRef<AbortController>();
  
  useEffect(() => {
    abortController.current = new AbortController();
    return () => {
      abortController.current?.abort();
    };
  }, []);

  const getSignal = () => {
    if (!abortController.current) {
      abortController.current = new AbortController();
    }
    return abortController.current.signal;
  };

  return { getSignal };
}
