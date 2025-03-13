import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Project, ProjectState } from '@/types'
import { projectService } from '@/services/projectService'

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  volumeData: null
}

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getProjects()
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(projectId)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData: Partial<Project>, { rejectWithValue }) => {
    try {
      return await projectService.createProject(projectData)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const updateProjectStatus = createAsyncThunk(
  'projects/updateStatus',
  async ({ projectId, status }: { projectId: string; status: 'active' | 'inactive' }, { rejectWithValue }) => {
    try {
      return await projectService.updateProjectStatus(projectId, status)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId)
      return projectId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

export const fetchVolumeData = createAsyncThunk(
  'projects/fetchVolumeData',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getVolumeData(projectId)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearCurrentProject: (state) => {
      state.currentProject = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateProjects: (state, action) => {
      state.projects = action.payload
    },
    updateCurrentProject: (state, action) => {
      state.currentProject = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single project
      .addCase(fetchProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false
        state.currentProject = action.payload
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false
        state.projects.push(action.payload)
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Update project status
      .addCase(updateProjectStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        state.loading = false
        const index = state.projects.findIndex(p => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload
        }
      })
      .addCase(updateProjectStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false
        state.projects = state.projects.filter(p => p._id !== action.payload)
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch volume data
      .addCase(fetchVolumeData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVolumeData.fulfilled, (state, action) => {
        state.volumeData = action.payload
        state.loading = false
      })
      .addCase(fetchVolumeData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { clearCurrentProject, clearError, updateProjects, updateCurrentProject } = projectSlice.actions
export default projectSlice.reducer 