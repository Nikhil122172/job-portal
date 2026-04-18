import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { notificationsApi, NotificationApiResponse } from '../../core/api/services'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
  read: boolean
}

interface NotificationsState {
  items: Notification[]
  loading: boolean
}

const toUiNotification = (n: NotificationApiResponse): Notification => ({
  id: String(n.id),
  title: n.subject || 'Notification',
  message: n.body || '',
  type: n.type?.toLowerCase() === 'error' ? 'error' : 'info',
  timestamp: n.sentAt ? new Date(n.sentAt).getTime() : new Date(n.createdAt).getTime(),
  read: !!n.isRead,
})

const initialState: NotificationsState = {
  items: [],
  loading: false,
}

export const fetchMyNotificationsThunk = createAsyncThunk(
  'notifications/fetchMy',
  async ({ page = 0, size = 20 }: { page?: number; size?: number } = {}, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.getMyNotifications(page, size)
      return res.data.content
    } catch {
      return rejectWithValue('Failed to fetch notifications')
    }
  },
)

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await notificationsApi.markAsRead(Number(id))
      return id
    } catch {
      return rejectWithValue('Failed to mark notification as read')
    }
  },
)

export const markAllAsReadThunk = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead()
      return true
    } catch {
      return rejectWithValue('Failed to mark all as read')
    }
  },
)

export const clearAllNotificationsThunk = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.clearAll()
      return true
    } catch {
      return rejectWithValue('Failed to clear notifications')
    }
  },
)

export const removeNotificationThunk = createAsyncThunk(
  'notifications/removeOne',
  async (id: string, { rejectWithValue }) => {
    try {
      await notificationsApi.deleteOne(Number(id))
      return id
    } catch {
      return rejectWithValue('Failed to remove notification')
    }
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification at the beginning
      state.items.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotificationsThunk.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchMyNotificationsThunk.fulfilled, (state, action: PayloadAction<NotificationApiResponse[]>) => {
        state.loading = false
        state.items = action.payload.map(toUiNotification)
      })
      .addCase(fetchMyNotificationsThunk.rejected, (state) => {
        state.loading = false
      })
      .addCase(markAsReadThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.map((n) => (n.id === action.payload ? { ...n, read: true } : n))
      })
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }))
      })
      .addCase(clearAllNotificationsThunk.fulfilled, (state) => {
        state.items = []
      })
      .addCase(removeNotificationThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((n) => n.id !== action.payload)
      })
  },
})

export const { addNotification } = notificationsSlice.actions
export const removeNotification = removeNotificationThunk
export const clearAllNotifications = clearAllNotificationsThunk
export const markAsRead = markAsReadThunk
export const markAllAsRead = markAllAsReadThunk
export default notificationsSlice.reducer
