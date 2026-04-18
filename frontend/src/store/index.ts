import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import jobsReducer from './slices/jobsSlice'
import applicationsReducer from './slices/applicationsSlice'
import uiReducer from './slices/uiSlice'
import notificationsReducer from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    applications: applicationsReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
