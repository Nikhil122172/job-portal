import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  darkMode: boolean
  sidebarOpen: boolean
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const storedTheme = localStorage.getItem('theme')

const initialState: UiState = {
  darkMode: storedTheme ? storedTheme === 'dark' : prefersDark,
  sidebarOpen: false,
}

// Apply theme on load
if (initialState.darkMode) document.documentElement.classList.add('dark')

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', state.darkMode)
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload
      localStorage.setItem('theme', action.payload ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', action.payload)
    },
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setSidebar(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload },
  },
})

export const { toggleDarkMode, setDarkMode, toggleSidebar, setSidebar } = uiSlice.actions
export default uiSlice.reducer
