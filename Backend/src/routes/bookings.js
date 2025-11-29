import express from 'express'
import Booking from '../models/Booking.js'
import Offer from '../models/Offer.js'
import Request from '../models/Request.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Create a booking
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const { offerId, scheduledAt, notes } = req.body

		if (!offerId || !scheduledAt) {
			return res.status(400).json({ message: 'Offer ID and scheduled date are required' })
		}

		// Get offer and related data
		const offer = await Offer.findById(offerId).populate('requestId').populate('workshopId')
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' })
		}

		if (offer.status !== 'SENT') {
			return res.status(400).json({ message: 'Offer is not available for booking' })
		}

		// Calculate commission (e.g., 10%)
		const commissionRate = 0.1
		const totalAmount = offer.price
		const commission = totalAmount * commissionRate
		const workshopAmount = totalAmount - commission

		// Create booking
		const booking = await Booking.create({
			requestId: offer.requestId._id,
			offerId: offer._id,
			customerId: req.user._id,
			workshopId: offer.workshopId._id,
			scheduledAt: new Date(scheduledAt),
			totalAmount,
			commission,
			workshopAmount,
			notes,
		})

		// Update offer status
		await Offer.findByIdAndUpdate(offerId, { status: 'ACCEPTED' })

		// Update request status
		await Request.findByIdAndUpdate(offer.requestId._id, { status: 'BOOKED' })

		const populatedBooking = await Booking.findById(booking._id)
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')

		return res.status(201).json(populatedBooking)
	} catch (error) {
		console.error('Booking creation error:', error)
		return res.status(500).json({ message: 'Failed to create booking' })
	}
})

// Get bookings for a customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
	try {
		const { customerId } = req.params

		if (req.user._id.toString() !== customerId && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const bookings = await Booking.find({ customerId })
			.populate('requestId')
			.populate('offerId')
			.populate('workshopId', 'companyName rating')
			.sort({ createdAt: -1 })

		return res.json(bookings)
	} catch (error) {
		console.error('Fetch bookings error:', error)
		return res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// Get bookings for a workshop (by workshop ID - for admin or direct access)
router.get('/workshop/:workshopId', authenticate, async (req, res) => {
	try {
		const { workshopId } = req.params

		// Check if user owns the workshop or is admin
		const Workshop = (await import('../models/Workshop.js')).default
		const workshop = await Workshop.findById(workshopId)
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		if (workshop.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const bookings = await Booking.find({ workshopId })
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email phone')
			.sort({ createdAt: -1 })

		return res.json(bookings)
	} catch (error) {
		console.error('Fetch workshop bookings error:', error)
		return res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// Get bookings for authenticated workshop user
router.get('/workshop/me', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		// Find workshop for this user
		const Workshop = (await import('../models/Workshop.js')).default
		const workshop = await Workshop.findOne({ userId: req.user._id })
		
		console.log('Workshop lookup - User ID:', req.user._id)
		console.log('Workshop found:', workshop ? workshop._id : 'Not found')
		
		if (!workshop) {
			console.log('Workshop not found for user:', req.user._id)
			return res.status(404).json({ message: 'Workshop not found' })
		}

		console.log('Fetching bookings for workshop:', workshop._id)
		
		// First, find all offers with ACCEPTED status for this workshop
		const acceptedOffers = await Offer.find({ 
			workshopId: workshop._id,
			status: 'ACCEPTED'
		}).select('_id')
		
		const acceptedOfferIds = acceptedOffers.map(offer => offer._id)
		console.log('Accepted offer IDs:', acceptedOfferIds.length)
		
		// Find bookings only for accepted offers
		const bookings = await Booking.find({ 
			workshopId: workshop._id,
			offerId: { $in: acceptedOfferIds }
		})
			.populate({
				path: 'requestId',
				select: 'description status createdAt',
				populate: { 
					path: 'vehicleId', 
					select: 'make model year'
				}
			})
			.populate({
				path: 'offerId',
				select: 'price estimatedDuration warranty status createdAt'
			})
			.populate({
				path: 'customerId', 
				select: 'name email phone'
			})
			.sort({ createdAt: -1 })

		console.log('Bookings found (accepted proposals only):', bookings.length)
		console.log('Sample booking:', bookings.length > 0 ? JSON.stringify(bookings[0], null, 2) : 'No bookings')
		
		// Return empty array if no bookings found (this is not an error)
		// Always return 200 status with array (empty or with data)
		return res.status(200).json(bookings || [])
	} catch (error) {
		console.error('Fetch workshop bookings error:', error)
		console.error('Error stack:', error.stack)
		// Return empty array instead of error for better UX
		// Only return error if it's a critical issue
		if (error.name === 'CastError' || error.name === 'ValidationError') {
			return res.status(400).json({ message: 'Invalid request', error: error.message })
		}
		return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message })
	}
})

// Update booking (for cancel/reschedule)
router.patch('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		const { status, scheduledAt, notes } = req.body

		const booking = await Booking.findById(id)
		if (!booking) {
			return res.status(404).json({ message: 'Booking not found' })
		}

		// Check if user is the customer who made the booking or is admin
		if (booking.customerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const updateData = {}
		if (status) {
			updateData.status = status
		} else if (scheduledAt) {
			// If rescheduling (scheduledAt provided but no status), set to RESCHEDULED
			updateData.status = 'RESCHEDULED'
		}
		if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt)
		if (notes !== undefined) updateData.notes = notes

		const updatedBooking = await Booking.findByIdAndUpdate(
			id,
			updateData,
			{ new: true }
		)
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')

		// If cancelled, update request status back to BIDDING_CLOSED
		if (updateData.status === 'CANCELLED' && booking.requestId) {
			await Request.findByIdAndUpdate(booking.requestId, { status: 'BIDDING_CLOSED' })
		}

		// If completed (DONE), update request status to COMPLETED
		if (updateData.status === 'DONE' && booking.requestId) {
			await Request.findByIdAndUpdate(booking.requestId, { status: 'COMPLETED' })
		}

		return res.json(updatedBooking)
	} catch (error) {
		console.error('Update booking error:', error)
		return res.status(500).json({ message: 'Failed to update booking' })
	}
})

export default router

