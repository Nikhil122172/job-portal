import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { jobsApi, JobResponse, PageResponse, JobSearchParams } from '../../core/api/services'
import toast from 'react-hot-toast'

interface JobsState {
  jobs: JobResponse[]
  currentJob: JobResponse | null
  myJobs: JobResponse[]
  myJobsTotalPages: number
  myJobsCurrentPage: number
  myJobsTotalElements: number
  categories: string[]
  totalPages: number
  totalElements: number
  currentPage: number
  loading: boolean
  myJobsLoading: boolean
  error: string | null
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  myJobs: [],
  myJobsTotalPages: 0,
  myJobsCurrentPage: 0,
  myJobsTotalElements: 0,
  categories: [],
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  loading: false,
  myJobsLoading: false,
  error: null,
}

export const searchJobsThunk = createAsyncThunk(
  'jobs/search',
  async (params: JobSearchParams, { rejectWithValue }) => {
    try {
      const res = await jobsApi.search(params)
      return res.data
    } catch {
      return rejectWithValue('Unable to load jobs. Please try again.')
    }
  },
)

export const getJobByIdThunk = createAsyncThunk(
  'jobs/getById',
  async ({ id, incrementViewCount = true }: { id: string | number; incrementViewCount?: boolean }, { rejectWithValue }) => {
    try {
      const res = await jobsApi.getById(id, incrementViewCount)
      return res.data
    } catch {
      return rejectWithValue('Job not found')
    }
  },
)

export const getMyJobsThunk = createAsyncThunk(
  'jobs/getMyJobs',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const res = await jobsApi.getMyJobs(page, size)
      return res.data
    } catch {
      return rejectWithValue('Unable to load your jobs. Please try again.')
    }
  },
)

export const createJobThunk = createAsyncThunk(
  'jobs/create',
  async (data: Parameters<typeof jobsApi.create>[0], { rejectWithValue }) => {
    try {
      const res = await jobsApi.create(data)
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to create the job. Please try again.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

export const updateJobThunk = createAsyncThunk(
  'jobs/update',
  async ({ id, data }: { id: string | number; data: Partial<Parameters<typeof jobsApi.create>[0]> }, { rejectWithValue }) => {
    try {
      const res = await jobsApi.update(id, data)
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update the job. Please try again.'
      toast.error(msg)
      return rejectWithValue(msg)
    }
  },
)

export const deleteJobThunk = createAsyncThunk(
  'jobs/delete',
  async (id: string | number, { rejectWithValue }) => {
    try {
      await jobsApi.delete(id)
      toast.success('Job deleted successfully')
      return id
    } catch {
      toast.error('Unable to delete the job. Please try again.')
      return rejectWithValue('Unable to delete the job. Please try again.')
    }
  },
)

export const getCategoriesThunk = createAsyncThunk('jobs/categories', async () => {
  const res = await jobsApi.getCategories()
  return res.data
})

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearCurrentJob(state) { state.currentJob = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchJobsThunk.pending, (state) => { state.loading = true })
      .addCase(searchJobsThunk.fulfilled, (state, { payload }: { payload: PageResponse<JobResponse> }) => {
        state.loading = false
        state.jobs = payload.content
        state.totalPages = payload.totalPages
        state.totalElements = payload.totalElements
        state.currentPage = payload.number
      })
      .addCase(searchJobsThunk.rejected, (state) => { state.loading = false })

      .addCase(getJobByIdThunk.pending, (state) => { state.loading = true; state.currentJob = null })
      .addCase(getJobByIdThunk.fulfilled, (state, { payload }) => { state.loading = false; state.currentJob = payload })
      .addCase(getJobByIdThunk.rejected, (state) => { state.loading = false })

      .addCase(getMyJobsThunk.pending, (state) => { state.myJobsLoading = true })
      .addCase(getMyJobsThunk.fulfilled, (state, { payload }: { payload: PageResponse<JobResponse> }) => {
        state.myJobsLoading = false
        state.myJobs = payload.content
        state.myJobsTotalPages = payload.totalPages
        state.myJobsCurrentPage = payload.number
        state.myJobsTotalElements = payload.totalElements
      })
      .addCase(getMyJobsThunk.rejected, (state) => { state.myJobsLoading = false })

      .addCase(createJobThunk.fulfilled, (state, { payload }) => {
        state.myJobs = [payload, ...state.myJobs]
      })

      .addCase(updateJobThunk.fulfilled, (state, { payload }) => {
        state.myJobs = state.myJobs.map((j) => (j.id === payload.id ? payload : j))
        if (state.currentJob?.id === payload.id) state.currentJob = payload
      })

      .addCase(deleteJobThunk.fulfilled, (state, { payload }) => {
        state.myJobs = state.myJobs.filter((j) => j.id !== payload)
      })

      .addCase(getCategoriesThunk.fulfilled, (state, { payload }) => {
        state.categories = payload
      })
  },
})

export const { clearCurrentJob } = jobsSlice.actions
export default jobsSlice.reducer
