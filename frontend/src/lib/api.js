import axios from 'axios'

// 使用相對路徑：dev 模式由 vite proxy 轉發到 :8080，production 由 Flask 直接處理
export const api = axios.create({ baseURL: '/api' })

export const THEMES = [
  { id: 'travel', name: '旅遊', emoji: '✈️' },
  { id: 'business', name: '商務', emoji: '💼' },
  { id: 'daily', name: '日常', emoji: '🏠' },
  { id: 'food', name: '飲食', emoji: '🍔' },
  { id: 'shopping', name: '購物', emoji: '🛍️' },
  { id: 'technology', name: '科技', emoji: '💻' },
]

export const themeName = (id) => THEMES.find((t) => t.id === id)?.name || id
export const themeEmoji = (id) => THEMES.find((t) => t.id === id)?.emoji || '📘'
