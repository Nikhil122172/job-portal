import api from '../axios'
import type { PageResponse } from './common'

export interface RegisterRequest {
  username: string
  email: string
  password: string
  fullName: string
  phoneNumber: string
  role: 'JOB_SEEKER' | 'RECRUITER'
  companyName?: string
  otp?: string
}

export interface LoginRequest { email: string; password: string }

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export interface UserResponse {
  id: number
  uuid?: string
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  profileImageUrl?: string
  bio?: string
  location?: string
  companyName?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phoneNumber: string
  bio?: string
  location?: string
  companyName?: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  sendOtp: (email: string) =>
    api.post('/auth/request-email-otp', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/verify-email-otp', { email, otp }),

  getMe: () =>
    api.get<UserResponse>('/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<UserResponse>('/users/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/me/change-password', { currentPassword, newPassword }),

  uploadProfileImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UserResponse>('/users/me/profile-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAllUsers: (page = 0, size = 10) =>
    api.get<PageResponse<UserResponse>>('/users', { params: { page, size } }),

  toggleUserStatus: (id: string | number) =>
    api.patch(`/users/${id}/toggle-status`),

  deleteUser: (id: string | number) =>
    api.delete(`/users/${id}`),
}
