import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wardrobeai_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wardrobeai_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const register = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)
export const getProfile = () => api.get('/api/auth/profile')
export const updateProfile = (data) => api.put('/api/auth/profile', data)
export const updateApiKey = (data) => api.put('/api/auth/api-key', data)
export const saveOnboarding = (data) => api.post('/api/auth/onboarding', data)

// Wardrobe
export const getCloths = (params) => api.get('/api/wardrobe', { params })
export const getCloth = (id) => api.get(`/api/wardrobe/${id}`)
export const addCloth = (formData) => api.post('/api/wardrobe', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateCloth = (id, data) => api.put(`/api/wardrobe/${id}`, data)
export const deleteCloth = (id) => api.delete(`/api/wardrobe/${id}`)
export const markWorn = (id) => api.post(`/api/wardrobe/${id}/worn`)
export const updateClothStatus = (id, status) => api.put(`/api/wardrobe/${id}/status`, { status })

// Outfits
export const suggestOutfit = (data) => api.post('/api/outfits/suggest', data)
export const getSuggestions = () => api.get('/api/outfits/suggestions')
export const rateSuggestion = (id, rating) => api.put(`/api/outfits/suggestions/${id}/rate`, { rating })
export const wearSuggestion = (id) => api.post(`/api/outfits/suggestions/${id}/wear`)
export const judgeOutfit = (formData) => api.post('/api/outfits/judge', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// Laundry
export const getLaundry = () => api.get('/api/laundry')
export const updateLaundry = (clothId, status) => api.put(`/api/laundry/${clothId}`, { status })
export const getOverdueLaundry = () => api.get('/api/laundry/overdue')

// Analytics
export const getDashboardStats = () => api.get('/api/analytics/dashboard')
export const getMostWorn = () => api.get('/api/analytics/most-worn')
export const getLeastWorn = () => api.get('/api/analytics/least-worn')
export const getCostPerWear = () => api.get('/api/analytics/cost-per-wear')
export const getStylePersona = () => api.get('/api/analytics/persona')

// Shopping
export const analyzeGaps = () => api.get('/api/shopping/gaps')
export const getWishlist = () => api.get('/api/shopping')
export const addToWishlist = (data) => api.post('/api/shopping', data)
export const updateWishlistItem = (id, data) => api.put(`/api/shopping/${id}`, data)
export const deleteWishlistItem = (id) => api.delete(`/api/shopping/${id}`)

// Stylist
export const packTrip = (data) => api.post('/api/stylist/pack-trip', data)
export const buildCapsule = (data) => api.post('/api/stylist/capsule', data)
export const getSeasonalRefresh = () => api.get('/api/stylist/seasonal-refresh')

// Calendar
export const getCalendarAuthUrl = () => api.get('/api/calendar/auth-url')
export const getCalendarEvents = (params) => api.get('/api/calendar/events', { params })
export const createOutfitEvent = (data) => api.post('/api/calendar/outfit-event', data)
export const getWeeklyPlan = () => api.get('/api/calendar/weekly-plan')

export default api
