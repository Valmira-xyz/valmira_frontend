import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from 'axios'
import type { Project } from "@/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Helper function to get auth headers
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  withCredentials: true,
})

// API functions
const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
      `${BACKEND_URL}/projects`,
      getAuthHeaders()
    )
    return response.data.data.projects
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await axios.get<ApiResponse<{ project: Project }>>(
      `${BACKEND_URL}/projects/${projectId}`,
      getAuthHeaders()
    )
    return response.data.data.project
  },

  createProject: async (projectData: Partial<Project>) => {
    const response = await axios.post<ApiResponse<{ project: Project }>>(
      `${BACKEND_URL}/projects`,
      projectData,
      getAuthHeaders()
    )
    return response.data.data.project
  },

  updateProjectStatus: async (projectId: string, status: 'active' | 'inactive') => {
    const response = await axios.patch<ApiResponse<{ project: Project }>>(
      `${BACKEND_URL}/projects/${projectId}/status`,
      { status },
      getAuthHeaders()
    )
    return response.data.data.project
  },

  deleteProject: async (projectId: string) => {
    await axios.delete(
      `${BACKEND_URL}/projects/${projectId}`,
      getAuthHeaders()
    )
  },

  getVolumeData: async (projectId: string) => {
    const response = await axios.get<ApiResponse<{ volumeData: any }>>(
      `${BACKEND_URL}/projects/${projectId}/volume`,
      getAuthHeaders()
    )
    return response.data.data.volumeData
  }
}

// React Query hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
    retry: false, // Don't retry on failure (e.g., 401 errors)
  })
}

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
    retry: false,
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }
  })
}

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: 'active' | 'inactive' }) =>
      projectApi.updateProjectStatus(projectId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] })
    }
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    }
  })
}

export const useProjectVolumeData = (projectId: string) => {
  return useQuery({
    queryKey: ["project", projectId, "volume"],
    queryFn: () => projectApi.getVolumeData(projectId),
    enabled: !!projectId,
    retry: false,
  })
}

