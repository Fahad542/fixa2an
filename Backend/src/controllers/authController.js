import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { sendEmail, emailTemplates } from '../config/email.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const register = async (req, res) => {
	try {
		const {
			name,
			email,
			password,
			phone,
			address,
			city,
			postalCode,
			role = 'CUSTOMER',
		} = req.body

		const errors = {}

		if (!email) {
			errors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errors.email = 'Invalid email format'
		}

		if (!password) {
			errors.password = 'Password is required'
		} else if (password.length < 6) {
			errors.password = 'Password must be at least 6 characters long'
		}

		if (name && name.trim().length === 0) {
			errors.name = 'Name cannot be empty'
		}

		if (Object.keys(errors).length > 0) {
			return res.status(400).json({ 
				message: 'Validation failed',
				errors 
			})
		}

		const existingUser = await User.findOne({ email })
		if (existingUser) {
			return res.status(400).json({ 
				message: 'A user with this email address already exists',
				errors: { email: 'A user with this email address already exists' }
			})
		}

		const user = await User.create({
			name,
			email,
			password,
			phone,
			address,
			city,
			postalCode,
			role,
		})

		if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
			try {
				await sendEmail(
					email,
					emailTemplates.accountVerification(
						`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${user._id}`,
					),
				)
			} catch (emailError) {
				console.error('Failed to send welcome email:', emailError)
			}
		}

		return res.status(201).json({ message: 'Account created successfully', userId: user._id })
	} catch (error) {
		console.error('Registration error:', error)
		return res.status(500).json({ message: 'Something went wrong with the registration' })
	}
}

export const login = async (req, res) => {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' })
		}

		// Normalize email: trim whitespace and convert to lowercase
		const normalizedEmail = email.trim().toLowerCase()

		// Find user by email (case-insensitive)
		const user = await User.findOne({ 
			email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
		})
		
		if (!user) {
			console.log('Login attempt failed: User not found for email:', normalizedEmail)
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		// Check if password exists and is valid
		if (!user.password) {
			console.log('Login attempt failed: User has no password set')
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		const isPasswordValid = await bcrypt.compare(password, user.password)
		if (!isPasswordValid) {
			console.log('Login attempt failed: Invalid password for user:', user.email)
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		if (!user.isActive) {
			console.log('Login attempt failed: Account is inactive for user:', user.email)
			return res.status(403).json({ 
				message: 'Your account is inactive. Please contact support or wait for admin approval.' 
			})
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			JWT_SECRET,
			{ expiresIn: '7d' }
		)

		console.log('Login successful for user:', user.email, 'Role:', user.role)

		return res.json({
			token,
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		})
	} catch (error) {
		console.error('Login error:', error)
		return res.status(500).json({ message: 'Something went wrong. Please try again.' })
	}
}

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password')
		return res.json(user)
	} catch (error) {
		console.error('Get me error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}

export const updateProfile = async (req, res) => {
	try {
		const { id } = req.params
		const { name, email, phone, address, city, postalCode, country } = req.body

		// Check if user is updating their own profile or is admin
		if (req.user._id.toString() !== id && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const user = await User.findById(id)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Check if email is being changed and if it's already taken
		if (email && email !== user.email) {
			const existingUser = await User.findOne({ email })
			if (existingUser) {
				return res.status(400).json({ 
					message: 'Email already in use',
					errors: { email: 'A user with this email address already exists' }
				})
			}
		}

		// Update user fields
		if (name !== undefined) user.name = name
		if (email !== undefined) user.email = email
		if (phone !== undefined) user.phone = phone
		if (address !== undefined) user.address = address
		if (city !== undefined) user.city = city
		if (postalCode !== undefined) user.postalCode = postalCode
		if (country !== undefined) user.country = country

		await user.save()

		const updatedUser = await User.findById(id).select('-password')
		return res.json(updatedUser)
	} catch (error) {
		console.error('Update profile error:', error)
		return res.status(500).json({ message: 'Failed to update profile' })
	}
}
