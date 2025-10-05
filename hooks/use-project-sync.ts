import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchPublicProjects } from '@/store/slices/projectSlice';
import type { RootState } from '@/store/store';

const REFRESH_INTERVAL = 60000; // Increased from 30s to 60s (1 minute)
const RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2; // For exponential backoff

export function useProjectSync() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.projects);
  const retryCount = useRef(0);
  const lastFetchTime = useRef(0);
  const [backoffDelay, setBackoffDelay] = useState(RETRY_DELAY);

  // Function to fetch projects with retry logic
  const fetchProjectsWithRetry = async () => {
    if (!isAuthenticated || loading) return;

    const now = Date.now();
    if (now - lastFetchTime.current < REFRESH_INTERVAL) return;

    try {
      lastFetchTime.current = now;
      // await dispatch(fetchProjects() as any); //original code to fetch only user's project

      // new code to fetch all public projects
      await dispatch(
        fetchPublicProjects({
          pageIndex: 0,
          maxPageCount: 10,
        }) as any
      );
      retryCount.current = 0; // Reset retry count on success
      setBackoffDelay(RETRY_DELAY); // Reset backoff delay
    } catch (error: any) {
      console.error('Error fetching projects:', error);

      // Check if it's a rate limit error (429)
      const isRateLimit =
        error?.status === 429 ||
        error?.response?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('rate limit');

      if (isRateLimit) {
        // For rate limit errors, use a longer delay
        console.warn('Rate limit reached. Backing off for a longer period.');
        setBackoffDelay((prev) => prev * BACKOFF_MULTIPLIER);
      }

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        setTimeout(
          fetchProjectsWithRetry,
          isRateLimit ? backoffDelay : RETRY_DELAY
        );
      }
    }
  };

  // Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('Initial projects sync...');
      fetchProjectsWithRetry();
    }
  }, [isAuthenticated]);
}
