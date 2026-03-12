import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach access token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
let refreshing = false
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry && !refreshing) {
      orig._retry = true
      refreshing = true
      try {
        const rt = localStorage.getItem('refreshToken')
        if (!rt) throw new Error('no refresh token')
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
