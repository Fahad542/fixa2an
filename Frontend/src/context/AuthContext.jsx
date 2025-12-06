import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import { getFullUrl } from '../config/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)
	const [token, setToken] = useState(localStorage.getItem('token'))

	useEffect(() => {
		if (token) {
			fetchUser()
		} else {
			setLoading(false)
		}
	}, [token])

	const fetchUser = async () => {
		try {
			const response = await authAPI.getMe()
			const userData = response.data
			// Convert relative image URL to absolute if needed
			if (userData?.image) {
				userData.image = getFullUrl(userData.image)
			}
			setUser(userData)
		} catch (error) {
			console.error('Failed to fetch user:', error)
			localStorage.removeItem('token')
			setToken(null)
		} finally {
			setLoading(false)
		}
	}

	const login = async (email, password) => {
		try {
			// Normalize email: trim whitespace and convert to lowercase
			const normalizedEmail = email.trim().toLowerCase()
			
			console.log('Attempting login with:', { email: normalizedEmail }) // Debug log
			const response = await authAPI.login({ email: normalizedEmail, password })
			console.log('Login response:', response.data) // Debug log
			
			const { token: newToken, user: userData } = response.data
			if (!newToken || !userData) {
				throw new Error('Invalid response from server')
			}
			
			localStorage.setItem('token', newToken)
			localStorage.setItem('user', JSON.stringify(userData))
			setToken(newToken)
			setUser(userData)
			return { success: true, user: userData }
		} catch (error) {
			console.error('Login error details:', error) // Debug log
			console.error('Error response:', error.response?.data) // Debug log
			
			// Provide more specific error messages
			let errorMessage = 'Login failed'
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message
			} else if (error.response?.status === 401) {
				errorMessage = 'Invalid email or password. Please check your credentials and try again.'
			} else if (error.response?.status === 403) {
				errorMessage = error.response.data.message || 'Your account is inactive. Please contact support.'
			} else if (error.response?.status === 500) {
				errorMessage = 'Server error. Please try again later.'
			} else if (error.message) {
				errorMessage = error.message
			}
			
			return {
				success: false,
				message: errorMessage,
			}
		}
	}

	const register = async (userData) => {
		try {
			const response = await authAPI.register(userData)
			return { success: true, data: response.data }
		} catch (error) {
			return {
				success: false,
				message: error.response?.data?.message || 'Registration failed',
				errors: error.response?.data?.errors || {},
			}
		}
	}

	const logout = () => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		setToken(null)
		setUser(null)
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within AuthProvider')
	}
	return context
}
