import { useEffect, useRef, useState } from "react";

interface UsePageLoaderOptions {
  /**
   * Minimum time (ms) the loader should remain visible.
   * Prevents flashing when data loads very quickly.
   */
  minimumDuration?: number;

  /**
   * Additional delay before hiding the loader.
   * Gives the progress bar time to finish gracefully.
   */
  exitDelay?: number;
}

export function usePageLoader(loading: boolean, options: UsePageLoaderOptions = {}) {
  const { minimumDuration = 900, exitDelay = 350 } = options;

  const [showLoader, setShowLoader] = useState(true);

  /**
   * Stores when the current loading cycle started.
   */
  const loadingStartRef = useRef<number | null>(null);

  /**
   * Stores the current timeout so it can always be cleared.
   */
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Loading has started
    if (loading) {
      // Only record the start once per loading cycle
      if (loadingStartRef.current === null) {
        loadingStartRef.current = performance.now();
      }

      setShowLoader(true);

      return;
    }

    // Safety fallback
    if (loadingStartRef.current === null) {
      loadingStartRef.current = performance.now();
    }

    const elapsed = performance.now() - loadingStartRef.current;

    const remainingTime = Math.max(minimumDuration - elapsed, 0);

    timeoutRef.current = window.setTimeout(() => {
      setShowLoader(false);

      // Reset for the next loading cycle
      loadingStartRef.current = null;
      timeoutRef.current = null;
    }, remainingTime + exitDelay);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, minimumDuration, exitDelay]);

  return {
    showLoader,
  };
}
