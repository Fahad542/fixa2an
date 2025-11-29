import express from 'express'
import User from '../models/User.js'
import Workshop from '../models/Workshop.js'
import Request from '../models/Request.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// All admin routes require authentication and ADMIN role
router.use(authenticate)
router.use(requireRole('ADMIN'))

// Get admin stats
router.get('/stats', async (req, res) => {
	try {
		const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' })
		const totalWorkshops = await Workshop.countDocuments()
		const pendingWorkshops = await Workshop.countDocuments({ isVerified: false })
		const totalRequests = await Request.countDocuments()
		const totalBookings = await Booking.countDocuments()
		
		// Calculate revenue from completed bookings
		const bookings = await Booking.find({ status: 'DONE' })
		const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.commission || 0), 0)
		
		// Monthly revenue (current month)
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const monthlyBookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startOfMonth }
		})
		const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + (booking.commission || 0), 0)

		res.json({
			totalCustomers,
			totalWorkshops,
			pendingWorkshops,
			totalRequests,
			totalBookings,
			totalRevenue,
			monthlyRevenue,
		})
	} catch (error) {
		console.error('Admin stats error:', error)
		res.status(500).json({ message: 'Failed to fetch stats' })
	}
})

// Get all users (customers)
router.get('/users', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, role } = req.query
		const query = {}
		
		if (role) {
			query.role = role
		} else {
			query.role = 'CUSTOMER' // Default to customers
		}
		
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const users = await User.find(query)
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get counts for each user
		const usersWithCounts = await Promise.all(
			users.map(async (user) => {
				const requestCount = await Request.countDocuments({ customerId: user._id })
				const bookingCount = await Booking.countDocuments({ customerId: user._id })
				return {
					...user,
					id: user._id,
					_count: {
						requests: requestCount,
						bookings: bookingCount,
					},
				}
			})
		)

		const total = await User.countDocuments(query)

		res.json({
			users: usersWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin users error:', error)
		res.status(500).json({ message: 'Failed to fetch users' })
	}
})

// Update user status
router.patch('/users/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { isActive } = req.body

		const user = await User.findByIdAndUpdate(
			id,
			{ isActive },
			{ new: true }
		)

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.json(user)
	} catch (error) {
		console.error('Update user error:', error)
		res.status(500).json({ message: 'Failed to update user' })
	}
})

// Get pending workshops
router.get('/pending-workshops', async (req, res) => {
	try {
		const workshops = await Workshop.find({ isVerified: false })
			.populate('userId', 'name email')
			.lean()

		const workshopsWithIds = workshops.map((w) => ({
			...w,
			id: w._id,
			email: w.email || w.userId?.email,
			createdAt: w.createdAt,
		}))

		res.json(workshopsWithIds)
	} catch (error) {
		console.error('Pending workshops error:', error)
		res.status(500).json({ message: 'Failed to fetch pending workshops' })
	}
})

// Get all workshops
router.get('/workshops', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, verified, active } = req.query
		const query = {}

		if (verified !== undefined) {
			query.isVerified = verified === 'true'
		}
		if (active !== undefined) {
			query.isActive = active === 'true'
		}
		if (search) {
			query.$or = [
				{ companyName: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const workshops = await Workshop.find(query)
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get counts for each workshop
		const workshopsWithCounts = await Promise.all(
			workshops.map(async (workshop) => {
				const offerCount = await Offer.countDocuments({ workshopId: workshop.userId })
				const bookingCount = await Booking.countDocuments({ workshopId: workshop.userId })
				const reviewCount = 0 // TODO: Add Review model count
				return {
					...workshop,
					id: workshop._id,
					_count: {
						offers: offerCount,
						bookings: bookingCount,
						reviews: reviewCount,
					},
				}
			})
		)

		const total = await Workshop.countDocuments(query)

		res.json({
			workshops: workshopsWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin workshops error:', error)
		res.status(500).json({ message: 'Failed to fetch workshops' })
	}
})

// Update workshop status
router.patch('/workshops', async (req, res) => {
	try {
		const { id, isVerified, isActive } = req.body

		const updateData = {}
		if (isVerified !== undefined) updateData.isVerified = isVerified
		if (isActive !== undefined) updateData.isActive = isActive

		const workshop = await Workshop.findByIdAndUpdate(id, updateData, { new: true })

		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		res.json(workshop)
	} catch (error) {
		console.error('Update workshop error:', error)
		res.status(500).json({ message: 'Failed to update workshop' })
	}
})

// Get all requests
router.get('/requests', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}
		if (search) {
			query.$or = [
				{ address: { $regex: search, $options: 'i' } },
				{ city: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const requests = await Request.find(query)
			.populate('customerId', 'name email')
			.populate('vehicleId', 'make model year')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get offer counts
		const requestsWithCounts = await Promise.all(
			requests.map(async (request) => {
				const offerCount = await Offer.countDocuments({ requestId: request._id })
				return {
					...request,
					id: request._id,
					customer: request.customerId,
					vehicle: request.vehicleId,
					_count: {
						offers: offerCount,
					},
				}
			})
		)

		const total = await Request.countDocuments(query)

		res.json({
			requests: requestsWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin requests error:', error)
		res.status(500).json({ message: 'Failed to fetch requests' })
	}
})

// Get all offers
router.get('/offers', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const offers = await Offer.find(query)
			.populate('workshopId', 'companyName')
			.populate('requestId', 'vehicleId')
			.populate({
				path: 'requestId',
				populate: { path: 'vehicleId', select: 'make model year' }
			})
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		const offersWithData = offers.map((offer) => ({
			...offer,
			id: offer._id,
			workshop: offer.workshopId,
			request: offer.requestId,
		}))

		const total = await Offer.countDocuments(query)

		res.json({
			offers: offersWithData,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin offers error:', error)
		res.status(500).json({ message: 'Failed to fetch offers' })
	}
})

// Get all bookings
router.get('/bookings', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const bookings = await Booking.find(query)
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		const bookingsWithData = bookings.map((booking) => ({
			...booking,
			id: booking._id,
			customer: booking.customerId,
			workshop: booking.workshopId,
		}))

		const total = await Booking.countDocuments(query)

		res.json({
			bookings: bookingsWithData,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin bookings error:', error)
		res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// Get payouts (simplified - generate on demand)
router.get('/payouts', async (req, res) => {
	try {
		const { month, year } = req.query
		
		if (!month || !year) {
			return res.json({ reports: [] })
		}

		// Get all bookings for the month/year that are DONE
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
		const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

		const bookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startDate, $lte: endDate }
		})
			.populate('workshopId', 'companyName')
			.lean()

		// Group by workshop
		const workshopMap = new Map()
		bookings.forEach((booking) => {
			const workshopId = booking.workshopId?._id?.toString()
			if (!workshopId) return

			if (!workshopMap.has(workshopId)) {
				workshopMap.set(workshopId, {
					workshopId,
					workshop: booking.workshopId,
					month: parseInt(month),
					year: parseInt(year),
					totalJobs: 0,
					totalAmount: 0,
					commission: 0,
					workshopAmount: 0,
					isPaid: false,
				})
			}

			const report = workshopMap.get(workshopId)
			report.totalJobs++
			report.totalAmount += booking.totalAmount || 0
			report.commission += booking.commission || 0
			report.workshopAmount += (booking.totalAmount || 0) - (booking.commission || 0)
		})

		const reports = Array.from(workshopMap.values()).map((report, index) => ({
			...report,
			id: `payout-${report.workshopId}-${month}-${year}-${index}`,
		}))

		res.json({ reports })
	} catch (error) {
		console.error('Admin payouts error:', error)
		res.status(500).json({ message: 'Failed to fetch payouts' })
	}
})

// Generate payouts (same as get, but POST)
router.post('/payouts', async (req, res) => {
	try {
		const { month, year } = req.body
		
		if (!month || !year) {
			return res.status(400).json({ message: 'Month and year are required' })
		}

		// Same logic as GET
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
		const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

		const bookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startDate, $lte: endDate }
		})
			.populate('workshopId', 'companyName')
			.lean()

		const workshopMap = new Map()
		bookings.forEach((booking) => {
			const workshopId = booking.workshopId?._id?.toString()
			if (!workshopId) return

			if (!workshopMap.has(workshopId)) {
				workshopMap.set(workshopId, {
					workshopId,
					workshop: booking.workshopId,
					month: parseInt(month),
					year: parseInt(year),
					totalJobs: 0,
					totalAmount: 0,
					commission: 0,
					workshopAmount: 0,
					isPaid: false,
				})
			}

			const report = workshopMap.get(workshopId)
			report.totalJobs++
			report.totalAmount += booking.totalAmount || 0
			report.commission += booking.commission || 0
			report.workshopAmount += (booking.totalAmount || 0) - (booking.commission || 0)
		})

		const reports = Array.from(workshopMap.values()).map((report, index) => ({
			...report,
			id: `payout-${report.workshopId}-${month}-${year}-${index}`,
		}))

		res.json({ reports, count: reports.length })
	} catch (error) {
		console.error('Generate payouts error:', error)
		res.status(500).json({ message: 'Failed to generate payouts' })
	}
})

// Mark payout as paid (simplified - just returns success)
router.patch('/payouts/:id/mark-paid', async (req, res) => {
	try {
		// In a real system, you'd update a Payout model
		// For now, just return success
		res.json({ message: 'Payout marked as paid' })
	} catch (error) {
		console.error('Mark payout paid error:', error)
		res.status(500).json({ message: 'Failed to mark payout as paid' })
	}
})

export default router

