
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '')

if (apiBaseUrl) {
  axios.defaults.baseURL = apiBaseUrl
}

const adminToken = localStorage.getItem('admin_token')

if (adminToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
}

axios.interceptors.response.use(
  res => res,
  err => {
    const requestUrl = String(err.config?.url ?? '')
    const isLoginRequest = requestUrl.includes('/api/auth/login')
    const isLoginPage = location.pathname.startsWith('/admin/login')

    if (
      err.response?.status === 401 &&
      location.pathname.startsWith('/admin') &&
      !isLoginPage &&
      !isLoginRequest
    ) {
      localStorage.removeItem('admin_token')
      delete axios.defaults.headers.common['Authorization']
      location.replace('/admin/login')
    }

    return Promise.reject(err)
  }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
