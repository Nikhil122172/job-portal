import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authApi, UserResponse, LoginRequest, RegisterRequest } from '../../core/api/services'
import { setTokens, clearTokens } from '../../core/api/axios'
import toast from 'react-hot-toast'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const stored = localStorage.getItem('user')
const initialState: AuthState = {
  user: stored ? JSON.parse(stored) : null,
  isAuthenticated: !!stored,
  loading: false,
  error: null,
}

// ── Thunks ────────────────────────────────────────────────────────────────────
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const res = await authApi.login(data)
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      const status = err?.response?.status
      const msg = err?.response?.data?.message || ''

      if (status === 404 || /user\s+not\s+found/i.test(msg)) {
        return rejectWithValue('User not found')
      }

      return rejectWithValue('Invalid email or password')
    }
  },
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const res = await authApi.register(data)
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to create your account. Please try again.'
      return rejectWithValue(msg)
    }
  },
)

export const getMeThunk = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.getMe()
    return res.data
  } catch {
    return rejectWithValue('Unable to fetch user details. Please try again.')
  }
})

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (data: Parameters<typeof authApi.updateProfile>[0], { rejectWithValue }) => {
    try {
      const res = await authApi.updateProfile(data)
      return res.data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Unable to update profile. Please try again.'
      return rejectWithValue(msg)
    }
  },
)

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      clearTokens()
      localStorage.removeItem('user')
      toast.success('You have been logged out successfully')
    },
    setUser(state, action: PayloadAction<UserResponse>) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = payload.user
        state.isAuthenticated = true
        setTokens(payload.accessToken, payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(payload.user))
        toast.success(`Welcome back, ${payload.user.fullName}!`)
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload as string
        toast.error(payload as string)
      })

    // Register
    builder
      .addCase(registerThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false
        // Keep user logged out after registration so they can sign in explicitly.
        state.user = null
        state.isAuthenticated = false
        clearTokens()
        localStorage.removeItem('user')
        toast.success('Account created successfully. Please log in.')
      })
      .addCase(registerThunk.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload as string
        toast.error(payload as string)
      })

    // Get Me
    builder
      .addCase(getMeThunk.fulfilled, (state, { payload }) => {
        state.user = payload
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(payload))
      })
      .addCase(getMeThunk.rejected, (state) => {
        state.user = null
        state.isAuthenticated = false
        clearTokens()
        localStorage.removeItem('user')
      })

    // Update Profile
    builder
      .addCase(updateProfileThunk.fulfilled, (state, { payload }) => {
        state.user = payload
        localStorage.setItem('user', JSON.stringify(payload))
        toast.success('Profile updated successfully')
      })
      .addCase(updateProfileThunk.rejected, (_, { payload }) => {
        toast.error(payload as string)
      })
  },
})

export const { logout, setUser } = authSlice.actions
export default authSlice.reducer
