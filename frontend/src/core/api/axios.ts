import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
const BASE_URL = (viteEnv?.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
const API_BASE_URL = `${BASE_URL}/api/v1`

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor - refresh token / error handling
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data
        setTokens(accessToken, newRefresh)
        original.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Global error messages
    const status = error.response?.status
    const message = (error.response?.data as { message?: string })?.message

    if (status === 403) toast.error('You do not have permission to perform this action.')
    else if (status === 404) { /* let callers handle 404 */ }
    else if (status === 409) toast.error(message || 'This action conflicts with existing data.')
    else if (status && status >= 500) toast.error('A server error occurred. Please try again.')

    return Promise.reject(error)
  },
)

// ── Token helpers (in-memory + sessionStorage for tab persistence) ──────────
let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken || sessionStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token')
}

export function setTokens(access: string, refresh: string) {
  _accessToken = access
  sessionStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  _accessToken = null
  sessionStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export default api
