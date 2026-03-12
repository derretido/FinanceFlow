import axios from 'axios'

// Pega a URL da Render na Vercel, ou usa o localhost se estiver no seu PC
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ 
  baseURL: API_URL 
})

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
    // Importante: usamos a URL completa para o refresh também
    if (err.response?.status === 401 && !orig._retry && !refreshing) {
      orig._retry = true
      refreshing = true
      try {
        const rt = localStorage.getItem('refreshToken')
        if (!rt) throw new Error('no refresh token')
        
        // Chamada direta via axios para evitar loop infinito com o interceptor
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: rt })
        
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