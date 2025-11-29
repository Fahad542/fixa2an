import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Workshop from '../models/Workshop.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { sendEmail, emailTemplates } from '../config/email.js'

const router = express.Router()

// Register a workshop
router.post('/register', async (req, res) => {
	try {
		const {
			name,
			email,
			password,
			phone,
			website,
			companyName,
			organizationNumber,
			address,
			city,
			postalCode,
			description,
			mondayOpen,
			mondayClose,
			tuesdayOpen,
			tuesdayClose,
			wednesdayOpen,
			wednesdayClose,
			thursdayOpen,
			thursdayClose,
			fridayOpen,
			fridayClose,
			saturdayOpen,
			saturdayClose,
			sundayOpen,
			sundayClose,
			brands,
			documents,
		} = req.body

		const errors = {}

		// Validate required fields
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

		if (!name) {
			errors.name = 'Name is required'
		}

		if (!organizationNumber) {
			errors.organizationNumber = 'Organization number is required'
		}

		if (!companyName) {
			errors.companyName = 'Company name is required'
		}

		if (Object.keys(errors).length > 0) {
			return res.status(400).json({ message: 'Validation failed', errors })
		}

		// Normalize email for checking and storing
		const normalizedEmail = email.trim().toLowerCase()

		// Check if user already exists (case-insensitive)
		const existingUser = await User.findOne({ 
			email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
		})
		if (existingUser) {
			return res.status(400).json({
				message: 'A user with this email address already exists',
				errors: { email: 'A user with this email address already exists' },
			})
		}

		// Check if workshop already exists
		const existingWorkshop = await Workshop.findOne({ organizationNumber })
		if (existingWorkshop) {
			return res.status(400).json({
				message: 'A workshop with this organization number already exists',
				errors: { organizationNumber: 'A workshop with this organization number already exists' },
			})
		}

		// Get coordinates (simplified - in production, use geocoding service)
		// For now, use default values or require them in the request
		const latitude = req.body.latitude || 59.3293 // Stockholm default
		const longitude = req.body.longitude || 18.0686

		try {
			// Create user with isActive: true (workshops can login immediately, but need verification for public listing)
			console.log('Creating workshop user with email:', normalizedEmail)
			const user = await User.create({
				name,
				email: normalizedEmail,
				password,
				phone,
				role: 'WORKSHOP',
				isActive: true, // Allow login immediately
			})
			console.log('User created successfully:', user._id)

			// Create opening hours object
			const openingHours = {
				monday: { open: mondayOpen, close: mondayClose },
				tuesday: { open: tuesdayOpen, close: tuesdayClose },
				wednesday: { open: wednesdayOpen, close: wednesdayClose },
				thursday: { open: thursdayOpen, close: thursdayClose },
				friday: { open: fridayOpen, close: fridayClose },
				saturday: { open: saturdayOpen, close: saturdayClose },
				sunday: { open: sundayOpen, close: sundayClose },
			}

			// Create workshop
			console.log('Creating workshop for user:', user._id)
			const workshop = await Workshop.create({
				userId: user._id,
				companyName,
				organizationNumber,
				address,
				city,
				postalCode,
				country: 'SE',
				latitude,
				longitude,
				phone,
				email: normalizedEmail,
				website,
				description,
				openingHours: JSON.stringify(openingHours),
				brandsHandled: Array.isArray(brands) ? brands.join(',') : brands,
				isVerified: false, // Requires admin approval
			})
			console.log('Workshop created successfully:', workshop._id)

			// Handle documents if provided
			if (documents && Array.isArray(documents) && documents.length > 0) {
				// Documents are already uploaded, just store references if needed
				console.log('Documents uploaded:', documents.length)
			}

			// Send email notification (if configured)
			if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) {
				try {
					await sendEmail(
						normalizedEmail,
						emailTemplates.workshopRegistrationPending(companyName),
					)
				} catch (emailError) {
					console.error('Failed to send registration email:', emailError)
				}
			}

			return res.status(201).json({
				message: 'Workshop registration submitted successfully. Awaiting admin approval.',
				workshopId: workshop._id,
				userId: user._id,
			})
		} catch (userError) {
			console.error('Error creating user or workshop:', userError)
			// If user was created but workshop creation failed, we should handle it
			// For now, just return error
			return res.status(500).json({ 
				message: 'Failed to create workshop account',
				error: userError.message 
			})
		}
	} catch (error) {
		console.error('Workshop registration error:', error)
		return res.status(500).json({ 
			message: 'Something went wrong with the registration',
			error: error.message 
		})
	}
})

// Get workshop stats
router.get('/stats', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const Offer = (await import('../models/Offer.js')).default
		const Booking = (await import('../models/Booking.js')).default
		const Request = (await import('../models/Request.js')).default

		const [activeOffers, completedJobs, totalRequests, totalRevenue, completedContracts, proposalsSent] = await Promise.all([
			// Active offers (SENT status - pending customer response)
			Offer.countDocuments({ 
				workshopId: workshop._id,
				status: 'SENT'
			}),
			// Completed jobs (bookings with DONE status)
			Booking.countDocuments({ 
				workshopId: workshop._id,
				status: 'DONE'
			}),
			// Total available requests (NEW or IN_BIDDING status)
			Request.countDocuments({ 
				status: { $in: ['NEW', 'IN_BIDDING'] }
			}),
			// Total revenue from completed bookings
			Booking.aggregate([
				{ $match: { workshopId: workshop._id, status: 'DONE' } },
				{ $group: { _id: null, total: { $sum: '$workshopAmount' } } },
			]),
			// Completed contracts (offers with ACCEPTED status)
			Offer.countDocuments({ 
				workshopId: workshop._id,
				status: 'ACCEPTED'
			}),
			// Total proposals sent (all offers by this workshop)
			Offer.countDocuments({ 
				workshopId: workshop._id
			}),
		])

		return res.json({
			totalRequests,
			activeOffers,
			completedJobs,
			totalRevenue: totalRevenue[0]?.total || 0,
			completedContracts,
			proposalsSent,
			rating: workshop.rating,
			reviewCount: workshop.reviewCount,
		})
	} catch (error) {
		console.error('Workshop stats error:', error)
		return res.status(500).json({ message: 'Failed to fetch stats' })
	}
})

// Get workshop profile
router.get('/profile', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const user = await User.findById(req.user._id).select('-password')

		return res.json({
			user: {
				name: user.name,
				email: user.email,
				phone: user.phone,
			},
			workshop: {
				companyName: workshop.companyName,
				organizationNumber: workshop.organizationNumber,
				address: workshop.address,
				city: workshop.city,
				postalCode: workshop.postalCode,
				website: workshop.website,
				description: workshop.description,
				phone: workshop.phone,
				email: workshop.email,
			},
		})
	} catch (error) {
		console.error('Workshop profile fetch error:', error)
		return res.status(500).json({ message: 'Failed to fetch profile' })
	}
})

// Update workshop profile
router.patch('/profile', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const {
			name,
			phone,
			email,
			companyName,
			organizationNumber,
			address,
			city,
			postalCode,
			website,
			description,
		} = req.body

		// Update user if name, phone, or email provided
		if (name || phone || email) {
			const user = await User.findById(req.user._id)
			if (user) {
				if (name) user.name = name
				if (phone) user.phone = phone
				if (email) {
					// Check if email is already taken by another user
					const existingUser = await User.findOne({ 
						email: { $regex: new RegExp(`^${email.trim().toLowerCase()}$`, 'i') },
						_id: { $ne: req.user._id }
					})
					if (existingUser) {
						return res.status(400).json({ message: 'Email already in use' })
					}
					user.email = email.trim().toLowerCase()
				}
				await user.save()
			}
		}

		// Update workshop fields
		if (companyName) workshop.companyName = companyName
		if (organizationNumber) workshop.organizationNumber = organizationNumber
		if (address) workshop.address = address
		if (city) workshop.city = city
		if (postalCode) workshop.postalCode = postalCode
		if (website) workshop.website = website
		if (description) workshop.description = description
		if (phone) workshop.phone = phone
		if (email) workshop.email = email.trim().toLowerCase()

		await workshop.save()

		return res.json({
			message: 'Profile updated successfully',
			workshop,
		})
	} catch (error) {
		console.error('Workshop profile update error:', error)
		return res.status(500).json({ message: 'Failed to update profile' })
	}
})

export default router

