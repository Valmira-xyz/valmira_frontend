import axios from 'axios'
import type { Project } from "@/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
  withCredentials: true,
})

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const response = await axios.get<ApiResponse<{ projects: Project[] }>>(
        `${BACKEND_URL}/projects`,
        getAuthHeaders()
      )
      return response.data.data.projects
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  getProject: async (projectId: string): Promise<Project> => {
    try {
      const response = await axios.get<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects/${projectId}`,
        getAuthHeaders()
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error fetching project:', error)
      throw error
    }
  },

  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    try {
      const response = await axios.post<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects`,
        projectData,
        getAuthHeaders()
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  updateProjectStatus: async (projectId: string, status: 'active' | 'inactive'): Promise<Project> => {
    try {
      const response = await axios.patch<ApiResponse<{ project: Project }>>(
        `${BACKEND_URL}/projects/${projectId}/status`,
        { status },
        getAuthHeaders()
      )
      return response.data.data.project
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await axios.delete(
        `${BACKEND_URL}/projects/${projectId}`,
        getAuthHeaders()
      )
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  },

  getVolumeData: async (projectId: string): Promise<any> => {
    try {
      const response = await axios.get<ApiResponse<{ volumeData: any }>>(
        `${BACKEND_URL}/projects/${projectId}/volume`,
        getAuthHeaders()
      )
      return response.data.data.volumeData
    } catch (error) {
      console.error('Error fetching volume data:', error)
      throw error
    }
  }
} 