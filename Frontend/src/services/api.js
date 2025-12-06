import axios from 'axios'
import { API_BASE_URL } from '../config/api.js'

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
		// Skip ngrok browser warning for free plan
		'ngrok-skip-browser-warning': 'true',
	},
	timeout: 30000, // 30 second timeout
})

// Add token to requests if available
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// Handle auth errors
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// Log network errors for debugging
		if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
			console.error('Network error - is the backend server running?', error)
			return Promise.reject({
				...error,
				response: {
					data: { message: 'Cannot connect to server. Please make sure the backend is running and ngrok tunnel is active.' }
				}
			})
		}
		
		// Handle timeout errors
		if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
			console.error('Request timeout - server may be slow or ngrok tunnel may be inactive', error)
			return Promise.reject({
				...error,
				response: {
					data: { message: 'Request timed out. Please check your ngrok tunnel and try again.' }
				}
			})
		}
		
		if (error.response?.status === 401) {
			console.log('401 Unauthorized - clearing token')
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			// Don't redirect on login page - let the component handle it
			if (!window.location.pathname.includes('/auth/signin')) {
				window.location.href = '/auth/signin'
			}
		}
		return Promise.reject(error)
	}
)

// Auth API
export const authAPI = {
	register: (data) => api.post('/api/auth/register', data),
	login: (data) => api.post('/api/auth/login', data),
	getMe: () => api.get('/api/auth/me'),
	updateProfile: (userId, data) => api.patch(`/api/auth/profile/${userId}`, data),
}

// Vehicles API
export const vehiclesAPI = {
	create: (data) => api.post('/api/vehicles', data),
	getAll: () => api.get('/api/vehicles'),
}

// Requests API
export const requestsAPI = {
	create: (data) => api.post('/api/requests', data),
	getByCustomer: (customerId) => api.get(`/api/requests/customer/${customerId}`),
	getAvailable: (params) => api.get('/api/requests/available', { params }),
}

// Offers API
export const offersAPI = {
	create: (data) => api.post('/api/offers', data),
	update: (offerId, data) => api.patch(`/api/offers/${offerId}`, data),
	getByRequest: (requestId, params) =>
		api.get(`/api/offers/request/${requestId}`, { params }),
	getByWorkshop: () => api.get('/api/offers/workshop/me'),
	getAvailableRequests: (params) => api.get('/api/offers/requests/available', { params }),
}

// Bookings API
export const bookingsAPI = {
	create: (data) => api.post('/api/bookings', data),
	getByCustomer: (customerId) => api.get(`/api/bookings/customer/${customerId}`),
	getByWorkshop: (workshopId) => workshopId ? api.get(`/api/bookings/workshop/${workshopId}`) : api.get('/api/bookings/workshop/me'),
	getByWorkshopMe: () => api.get('/api/bookings/workshop/me'),
	update: (bookingId, data) => api.patch(`/api/bookings/${bookingId}`, data),
	cancel: (bookingId) => api.patch(`/api/bookings/${bookingId}`, { status: 'CANCELLED' }),
	reschedule: (bookingId, scheduledAt) => api.patch(`/api/bookings/${bookingId}`, { scheduledAt, status: 'RESCHEDULED' }),
	complete: (bookingId) => api.patch(`/api/bookings/${bookingId}`, { status: 'DONE' }),
}

// Upload API
export const uploadAPI = {
	uploadFile: (formData) =>
		api.post('/api/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		}),
}

// Workshop API
export const workshopAPI = {
	register: (data) => api.post('/api/workshop/register', data),
	getStats: () => api.get('/api/workshop/stats'),
	getProfile: () => api.get('/api/workshop/profile'),
	updateProfile: (data) => api.patch('/api/workshop/profile', data),
}

// Admin API
export const adminAPI = {
	getStats: () => api.get('/api/admin/stats'),
	getUsers: (params) => api.get('/api/admin/users', { params }),
	updateUser: (id, data) => api.patch(`/api/admin/users/${id}`, data),
	getPendingWorkshops: () => api.get('/api/admin/pending-workshops'),
	getWorkshops: (params) => api.get('/api/admin/workshops', { params }),
	updateWorkshop: (data) => api.patch('/api/admin/workshops', data),
	getRequests: (params) => api.get('/api/admin/requests', { params }),
	getOffers: (params) => api.get('/api/admin/offers', { params }),
	getBookings: (params) => api.get('/api/admin/bookings', { params }),
	getPayouts: (params) => api.get('/api/admin/payouts', { params }),
	generatePayouts: (data) => api.post('/api/admin/payouts', data),
	markPayoutPaid: (id) => api.patch(`/api/admin/payouts/${id}/mark-paid`),
}

export { api }
export default api

