import { useCallback, useEffect, useRef, useState } from 'react';
import { BATCH_SIZE, fetchReels } from '../api/reels';
import type { Reel } from '../types';

export function useReelFeed() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(-1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = pageRef.current + 1;
      const batch = await fetchReels(nextPage);

      if (batch.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      pageRef.current = nextPage;
      hasMoreRef.current = batch.length >= BATCH_SIZE;

      setReels((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const uniqueBatch = batch.filter((item) => !existingIds.has(item.id));
        return [...current, ...uniqueBatch];
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load reels.');
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadMore().finally(() => setInitialLoading(false));
  }, [loadMore]);

  return {
    reels,
    initialLoading,
    loadingMore,
    error,
    loadMore,
  };
}
