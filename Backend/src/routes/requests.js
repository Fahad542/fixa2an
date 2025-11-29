import express from 'express'
import Request from '../models/Request.js'
import Workshop from '../models/Workshop.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Create a request
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const {
			vehicleId,
			reportId,
			description,
			latitude,
			longitude,
			address,
			city,
			postalCode,
			country = 'SE',
			expiresAt,
		} = req.body

		if (!vehicleId || !reportId || !latitude || !longitude || !address || !city || !expiresAt) {
			return res.status(400).json({ message: 'Missing required fields' })
		}

		const request = await Request.create({
			customerId: req.user._id,
			vehicleId,
			reportId,
			description,
			latitude,
			longitude,
			address,
			city,
			postalCode,
			country,
			expiresAt: new Date(expiresAt),
		})

		const populatedRequest = await Request.findById(request._id)
			.populate('customerId', 'name email')
			.populate('vehicleId')
			.populate('reportId')

		return res.status(201).json(populatedRequest)
	} catch (error) {
		console.error('Request creation error:', error)
		return res.status(500).json({ message: 'Failed to create request' })
	}
})

// Get requests for a customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
	try {
		const { customerId } = req.params

		// Check if user is accessing their own requests or is admin
		if (req.user._id.toString() !== customerId && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const requests = await Request.find({ customerId })
			.populate('vehicleId')
			.populate('reportId')
			.populate('customerId', 'name email')
			.sort({ createdAt: -1 })

		// Populate offers and bookings for each request
		const requestsWithOffersAndBookings = await Promise.all(
			requests.map(async (request) => {
				const offers = await Offer.find({ requestId: request._id })
					.populate('workshopId', 'companyName rating reviewCount')
					.sort({ createdAt: -1 })

				const bookings = await Booking.find({ requestId: request._id })
					.populate('workshopId', 'companyName rating reviewCount')
					.populate('offerId', '_id id status price')
					.sort({ createdAt: -1 })

				return {
					...request.toObject(),
					offers: offers.map(offer => ({
						id: offer._id,
						_id: offer._id,
						price: offer.price,
						note: offer.note,
						status: offer.status,
						workshop: {
							companyName: offer.workshopId?.companyName,
							rating: offer.workshopId?.rating || 0,
							reviewCount: offer.workshopId?.reviewCount || 0,
						},
					})),
					bookings: bookings.map(booking => ({
						id: booking._id,
						_id: booking._id,
						status: booking.status,
						scheduledAt: booking.scheduledAt,
						totalAmount: booking.totalAmount,
						workshop: {
							companyName: booking.workshopId?.companyName,
							rating: booking.workshopId?.rating || 0,
							reviewCount: booking.workshopId?.reviewCount || 0,
						},
						workshopId: booking.workshopId,
					})),
				}
			})
		)

		return res.json(requestsWithOffersAndBookings)
	} catch (error) {
		console.error('Fetch requests error:', error)
		return res.status(500).json({ message: 'Failed to fetch requests' })
	}
})

// Get available requests for workshops (within radius)
router.get('/available', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const { latitude, longitude, radius = 50 } = req.query

		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		// Use workshop's location if not provided, or default to Stockholm
		const searchLat = latitude ? parseFloat(latitude) : (workshop.latitude || 59.3293)
		const searchLng = longitude ? parseFloat(longitude) : (workshop.longitude || 18.0686)
		const searchRadius = parseFloat(radius) || 50

		// Find requests within radius (simple distance calculation)
		// This is a simplified version - in production, use proper geospatial queries
		const requests = await Request.find({
			status: { $in: ['NEW', 'IN_BIDDING'] },
			expiresAt: { $gt: new Date() },
		})
			.populate('vehicleId')
			.populate('reportId')
			.populate('customerId', 'name email')
			.sort({ createdAt: -1 })

		// Filter by distance (Haversine formula simplified)
		const filteredRequests = requests.filter((req) => {
			const distance = calculateDistance(
				searchLat,
				searchLng,
				req.latitude,
				req.longitude
			)
			return distance <= searchRadius
		})

		// Get offers for each request from this workshop
		const requestsWithOffers = await Promise.all(
			filteredRequests.map(async (req) => {
				const Offer = (await import('../models/Offer.js')).default
				const offers = await Offer.find({
					requestId: req._id,
					workshopId: workshop._id,
				})
					.select('_id price status')
					.lean()

				// Convert to plain object and ensure proper structure
				const requestObj = req.toObject ? req.toObject() : req
				
				return {
					...requestObj,
					id: requestObj._id,
					_id: requestObj._id,
					vehicle: requestObj.vehicleId, // Also provide as 'vehicle' for frontend compatibility
					customer: requestObj.customerId, // Also provide as 'customer' for frontend compatibility
					offers: offers.map((offer) => ({
						id: offer._id,
						price: offer.price,
						status: offer.status,
					})),
				}
			})
		)

		return res.json(requestsWithOffers)
	} catch (error) {
		console.error('Fetch available requests error:', error)
		return res.status(500).json({ message: 'Failed to fetch available requests' })
	}
})

// Helper function to calculate distance between two coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371 // Radius of the Earth in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

export default router

