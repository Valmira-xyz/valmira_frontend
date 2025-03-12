import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProjects } from '@/store/slices/projectSlice'
import type { RootState } from '@/store/store'

const REFRESH_INTERVAL = 30000 // 30 seconds
const RETRY_DELAY = 5000 // 5 seconds
const MAX_RETRIES = 3

export function useProjectSync() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { loading, error } = useSelector((state: RootState) => state.projects)
  const retryCount = useRef(0)
  const lastFetchTime = useRef(0)

  // Function to fetch projects with retry logic
  const fetchProjectsWithRetry = async () => {
    if (!isAuthenticated || loading) return

    const now = Date.now()
    if (now - lastFetchTime.current < REFRESH_INTERVAL) return

    try {
      lastFetchTime.current = now
      await dispatch(fetchProjects() as any)
      retryCount.current = 0 // Reset retry count on success
    } catch (error) {
      console.error('Error fetching projects:', error)
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++
        setTimeout(fetchProjectsWithRetry, RETRY_DELAY)
      }
    }
  }

  // Initial fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('Initial projects sync...')
      fetchProjectsWithRetry()
    }
  }, [isAuthenticated])

  // Set up periodic refresh
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      if (!loading && !error) {
        console.log('Auto-refreshing projects data...')
        fetchProjectsWithRetry()
      }
    }, REFRESH_INTERVAL)

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, loading, error])

  // Handle error state
  useEffect(() => {
    if (error && retryCount.current < MAX_RETRIES) {
      console.log(`Retrying after error (attempt ${retryCount.current + 1}/${MAX_RETRIES})...`)
      const timeout = setTimeout(fetchProjectsWithRetry, RETRY_DELAY)
      return () => clearTimeout(timeout)
    }
  }, [error])
} 