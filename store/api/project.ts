import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Project, ProjectState, ProjectStatistics } from '@/types'; // Adjust path if necessary
import type { BotPerformanceHistory, ActivityLog, GlobalMetrics } from '@/services/projectService'; // Adjust path if necessary
import type { RootState } from '../store'; // Assuming you have a RootState type defined

type TrendDataPoint = { date: string; value: number }; // Define TrendDataPoint locally if not exported

// Define a service using a base URL and expected endpoints
export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/`, // Your API base URL
    prepareHeaders: (headers, { getState }) => {
      // Add authentication headers if needed
      // const token = (getState() as RootState).auth.token; // Example: Get token from auth slice
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      return headers;
    },
  }),
  tagTypes: ['Project', 'ProjectStats', 'GlobalMetrics', 'VolumeData', 'Activity', 'Performance', 'Trends'],
  endpoints: (builder) => ({
    // Query Endpoints (Fetching Data)
    getProjects: builder.query<Project[], void>({
      query: () => 'projects',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Project' as const, id: _id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getPublicProjects: builder.query<Project[], { pageIndex?: number; maxPageCount?: number }>({
      query: ({ pageIndex = 0, maxPageCount = 10 }) => `projects/public?pageIndex=${pageIndex}&maxPageCount=${maxPageCount}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Project' as const, id: _id })),
              { type: 'Project', id: 'PUBLIC_LIST' }, // Differentiate public list if needed
            ]
          : [{ type: 'Project', id: 'PUBLIC_LIST' }],
    }),
    getProject: builder.query<Project, string>({
      query: (projectId) => `projects/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'Project', id: projectId }],
    }),
    getVolumeData: builder.query<any, string>({ // Replace 'any' with the actual type for volume data
      query: (projectId) => `projects/${projectId}/volume`, // Adjust path as needed
      providesTags: (result, error, projectId) => [{ type: 'VolumeData', id: projectId }],
    }),
    getProjectStats: builder.query<ProjectStatistics, { projectId: string; timeRange?: { start: string; end: string } }>({
        query: ({ projectId, timeRange }) => ({
            url: `projects/${projectId}/stats`,
            params: timeRange ? { start: timeRange.start, end: timeRange.end } : undefined,
        }),
        providesTags: (result, error, { projectId }) => [{ type: 'ProjectStats', id: projectId }],
        // Transform response to ensure dates are Date objects if needed
        // transformResponse: (response: ProjectStatistics) => ({
        //   ...response,
        //   timeRange: {
        //     start: new Date(response.timeRange.start),
        //     end: new Date(response.timeRange.end),
        //   },
        //   metrics: {
        //       ...response.metrics,
        //       lastUpdate: new Date(response.metrics.lastUpdate)
        //   }
        // }),
    }),
    getRecentActivity: builder.query<ActivityLog[], { projectId: string; limit?: number }>({
      query: ({ projectId, limit }) => `projects/${projectId}/activity${limit ? `?limit=${limit}` : ''}`, // Adjust path as needed
      providesTags: (result, error, { projectId }) => [{ type: 'Activity', id: projectId }],
    }),
    getBotPerformanceHistory: builder.query<BotPerformanceHistory[], { projectId: string; startDate: string; endDate: string }>({
        query: ({ projectId, startDate, endDate }) => ({
            url: `projects/${projectId}/performance`, // Adjust path as needed
            params: { startDate, endDate },
        }),
        providesTags: (result, error, { projectId }) => [{ type: 'Performance', id: projectId }],
         // The original slice handled a potential { data: [...] } structure, replicate if necessary
        transformResponse: (response: { data: BotPerformanceHistory[] } | BotPerformanceHistory[]) => {
           if (response && 'data' in response && Array.isArray(response.data)) {
               return response.data;
           }
           return response as BotPerformanceHistory[];
        },
    }),
    getBnbPrice: builder.query<number, void>({
      query: () => 'web3/bnb-price', // Uses the base URL
      transformResponse: (response: { success: boolean; data?: { price: number } }) => {
          if (response.success && response.data?.price) {
              return response.data.price;
          }
          console.warn('Failed to fetch BNB price or invalid format, returning fallback.');
          return 300; // Fallback value same as in the thunk
      },
      providesTags: ['GlobalMetrics'], // Assuming BNB price is a global metric
    }),
    getGlobalMetrics: builder.query<GlobalMetrics, void>({
      query: () => 'metrics/global', // Adjust path as needed
      providesTags: ['GlobalMetrics'],
    }),
    getProfitTrending: builder.query<TrendDataPoint[], { projectId: string; startDate: string; endDate: string }>({
      query: ({ projectId, startDate, endDate }) => ({
        url: `projects/${projectId}/trends/profit`, // Adjust path as needed
        params: { startDate, endDate },
      }),
       providesTags: (result, error, { projectId }) => [{ type: 'Trends', id: `${projectId}-profit` }],
    }),
    getVolumeTrending: builder.query<TrendDataPoint[], { projectId: string; startDate: string; endDate: string }>({
      query: ({ projectId, startDate, endDate }) => ({
        url: `projects/${projectId}/trends/volume`, // Adjust path as needed
        params: { startDate, endDate },
      }),
       providesTags: (result, error, { projectId }) => [{ type: 'Trends', id: `${projectId}-volume` }],
    }),

    // Mutation Endpoints (Creating/Updating/Deleting Data)
    createProject: builder.mutation<Project, Partial<Project>>({
      query: (projectData) => ({
        url: 'projects',
        method: 'POST',
        body: projectData,
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }, { type: 'Project', id: 'PUBLIC_LIST' }], // Invalidate lists on creation
    }),
    updateProjectStatus: builder.mutation<Project, { projectId: string; status: 'active' | 'inactive' }>({
      query: ({ projectId, status }) => ({
        url: `projects/${projectId}/status`, // Adjust path as needed
        method: 'PUT', // Or PATCH
        body: { status },
      }),
      invalidatesTags: (result, error, { projectId }) => [
          { type: 'Project', id: projectId },
          { type: 'Project', id: 'LIST' },
          { type: 'Project', id: 'PUBLIC_LIST' }
        ], // Invalidate specific project and lists
    }),
    deleteProject: builder.mutation<{ success: boolean; id: string }, string>({
      query: (projectId) => ({
        url: `projects/${projectId}`,
        method: 'DELETE',
      }),
      // We optimistic update or invalidate tags here
      invalidatesTags: (result, error, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Project', id: 'LIST' },
        { type: 'Project', id: 'PUBLIC_LIST' }
      ],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetProjectsQuery,
  useGetPublicProjectsQuery,
  useGetProjectQuery,
  useGetVolumeDataQuery,
  useGetProjectStatsQuery,
  useGetRecentActivityQuery,
  useGetBotPerformanceHistoryQuery,
  useGetBnbPriceQuery,
  useGetGlobalMetricsQuery,
  useGetProfitTrendingQuery,
  useGetVolumeTrendingQuery,
  useCreateProjectMutation,
  useUpdateProjectStatusMutation,
  useDeleteProjectMutation,
} = projectApi;

// You might also export the api slice itself if needed elsewhere
// export default projectApi; 