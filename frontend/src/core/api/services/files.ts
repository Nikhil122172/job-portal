import api from '../axios'

export const filesApi = {
  uploadResume: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string; publicId: string }>('/files/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string; publicId: string }>('/files/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
