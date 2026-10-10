import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

const adminToken = localStorage.getItem('admin_token')
if (adminToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
}

axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && location.pathname.startsWith('/admin')) {
      localStorage.removeItem('admin_token')
      delete axios.defaults.headers.common['Authorization']
      location.href = '/admin/login'
    }
    return Promise.reject(err)
  }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
