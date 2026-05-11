import { useEffect, useRef, useState, type RefObject } from 'react';

const SENTINEL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px 400px 0px',
  threshold: 0,
};

const LOAD_DELAY_MS = 400;

export interface UseInfiniteScrollSentinelResult {
  sentinelRef: RefObject<HTMLDivElement>;
  isLoadingMore: boolean;
}

/**
 * Observes a sentinel element near the bottom of an infinite list and calls
 * `onAdvance` (after a short delay so the loading indicator is visible) when
 * it scrolls into view. The caller is responsible for rendering the sentinel
 * element (attaching `sentinelRef`) only when `hasMore` is true.
 *
 * The observer is re-attached after each advance so that, if the sentinel is
 * still intersecting once new rows render above it (tall viewport / sparse
 * content), `observer.observe()`'s initial callback chains another load.
 */
export const useInfiniteScrollSentinel = (
  hasMore: boolean,
  onAdvance: () => void,
): UseInfiniteScrollSentinelResult => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadTick, setLoadTick] = useState(0);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsLoadingMore(true);
        setTimeout(() => {
          onAdvanceRef.current();
          setLoadTick((t) => t + 1);
          setIsLoadingMore(false);
        }, LOAD_DELAY_MS);
      }
    }, SENTINEL_OBSERVER_OPTIONS);
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadTick]);

  return { sentinelRef, isLoadingMore };
};
