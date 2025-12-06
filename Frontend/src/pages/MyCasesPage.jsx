import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import {
	Car,
	Clock,
	Star,
	Eye,
	MessageSquare,
	Calendar,
	CheckCircle,
	XCircle,
	AlertCircle,
	X,
	RotateCcw,
	Building2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { requestsAPI, bookingsAPI, api } from '../services/api'
import { getFullUrl } from '../config/api.js'

export default function MyCasesPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('my_cases')
	const [reviewModalOpen, setReviewModalOpen] = useState(false)
	const [selectedRequestForReview, setSelectedRequestForReview] = useState(null)
	const [rating, setRating] = useState(0)
	const [reviewText, setReviewText] = useState('')
	const [isSubmittingReview, setIsSubmittingReview] = useState(false)
	const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
	const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState(null)
	const [newScheduledDate, setNewScheduledDate] = useState('')
	const [newScheduledTime, setNewScheduledTime] = useState('')
	const [isRescheduling, setIsRescheduling] = useState(false)
	const [isCancelling, setIsCancelling] = useState(false)
	const [isCompleting, setIsCompleting] = useState(false)
	const [bookingToCancel, setBookingToCancel] = useState(null)
	const [bookingToComplete, setBookingToComplete] = useState(null)
	const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
	const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
	const [completeRating, setCompleteRating] = useState(0)
	const [completeReviewText, setCompleteReviewText] = useState('')

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
				return
			}
			if (user.role === 'ADMIN') {
				navigate('/admin', { replace: true })
				return
			}
		}
	}, [user, authLoading, navigate])

	const fetchRequests = async () => {
		if (!user || user.role !== 'CUSTOMER') return

		try {
			const response = await requestsAPI.getByCustomer(user.id || user._id)
			if (response.data) {
				setRequests(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			toast.error(t('my_cases.fetch_error'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'CUSTOMER') {
			fetchRequests()
		}
	}, [user])

	const handleSubmitReview = async () => {
		if (!rating || !reviewText.trim() || !selectedRequestForReview) {
			toast.error(t('my_cases.review_required') || 'Please provide both rating and review text')
			return
		}

		setIsSubmittingReview(true)
		try {
			// TODO: Add API call to submit review
			// const response = await reviewsAPI.create({
			// 	requestId: selectedRequestForReview._id || selectedRequestForReview.id,
			// 	workshopId: selectedRequestForReview.bookings?.[0]?.workshopId?._id || selectedRequestForReview.bookings?.[0]?.workshopId?.id,
			// 	rating,
			// 	comment: reviewText,
			// })

			// For now, just show success message
			toast.success(t('my_cases.review_submitted') || 'Review submitted successfully!')
			setReviewModalOpen(false)
			setSelectedRequestForReview(null)
			setRating(0)
			setReviewText('')
		} catch (error) {
			console.error('Failed to submit review:', error)
			toast.error(t('my_cases.review_error') || 'Failed to submit review')
		} finally {
			setIsSubmittingReview(false)
		}
	}

	const handleCancelJob = async () => {
		if (!bookingToCancel) return

		setIsCancelling(true)
		try {
			const bookingId = bookingToCancel._id || bookingToCancel.id
			await bookingsAPI.cancel(bookingId)
			toast.success(t('my_cases.job_cancelled_success') || 'Job cancelled successfully')
			setCancelConfirmOpen(false)
			setBookingToCancel(null)
			fetchRequests() // Refresh the requests
		} catch (error) {
			console.error('Failed to cancel job:', error)
			toast.error(t('my_cases.job_cancel_error') || 'Failed to cancel job')
		} finally {
			setIsCancelling(false)
		}
	}

	const handleRescheduleJob = async () => {
		if (!selectedBookingForReschedule || !newScheduledDate || !newScheduledTime) {
			toast.error(t('my_cases.reschedule_date_required') || 'Please select both date and time')
			return
		}

		setIsRescheduling(true)
		try {
			const bookingId = selectedBookingForReschedule._id || selectedBookingForReschedule.id
			const scheduledAt = new Date(`${newScheduledDate}T${newScheduledTime}`)
			
			await bookingsAPI.reschedule(bookingId, scheduledAt.toISOString())
			toast.success(t('my_cases.job_rescheduled_success') || 'Job rescheduled successfully')
			setRescheduleModalOpen(false)
			setSelectedBookingForReschedule(null)
			setNewScheduledDate('')
			setNewScheduledTime('')
			fetchRequests() // Refresh the requests
		} catch (error) {
			console.error('Failed to reschedule job:', error)
			toast.error(t('my_cases.job_reschedule_error') || 'Failed to reschedule job')
		} finally {
			setIsRescheduling(false)
		}
	}

	const openRescheduleModal = (booking) => {
		setSelectedBookingForReschedule(booking)
		if (booking.scheduledAt) {
			const date = new Date(booking.scheduledAt)
			setNewScheduledDate(date.toISOString().split('T')[0])
			setNewScheduledTime(date.toTimeString().slice(0, 5))
		}
		setRescheduleModalOpen(true)
	}

	const openCancelConfirm = (booking) => {
		setBookingToCancel(booking)
		setCancelConfirmOpen(true)
	}

	const handleCompleteJob = async () => {
		if (!bookingToComplete) return

		// Validate rating and review
		if (!completeRating || completeRating < 1 || completeRating > 5) {
			toast.error(t('my_cases.rating_required') || 'Please provide a rating (1-5 stars)')
			return
		}

		if (!completeReviewText.trim()) {
			toast.error(t('my_cases.review_text_required') || 'Please provide a review')
			return
		}

		setIsCompleting(true)
		try {
			const bookingId = bookingToComplete._id || bookingToComplete.id
			const request = requests.find(r => r.bookings?.some(b => (b._id || b.id) === bookingId))
			
			// First, submit the review
			try {
				// Find the workshop ID from the booking
				const booking = request?.bookings?.find(b => (b._id || b.id) === bookingId) || bookingToComplete
				// Try different possible structures for workshopId
				let workshopId = booking?.workshopId?._id || booking?.workshopId?.id || booking?.workshopId
				
				// If workshopId is an object, extract the _id
				if (workshopId && typeof workshopId === 'object') {
					workshopId = workshopId._id || workshopId.id
				}
				
				if (workshopId) {
					await api.post('/api/reviews', {
						bookingId: bookingId,
						workshopId: workshopId,
						rating: completeRating,
						comment: completeReviewText.trim(),
					})
				} else {
					console.warn('Workshop ID not found for booking:', bookingId)
				}
			} catch (reviewError) {
				console.error('Failed to submit review:', reviewError)
				// Continue with completion even if review fails
			}

			// Then, complete the job
			await bookingsAPI.complete(bookingId)
			toast.success(t('my_cases.job_completed_success') || 'Job marked as completed successfully')
			setCompleteConfirmOpen(false)
			setBookingToComplete(null)
			setCompleteRating(0)
			setCompleteReviewText('')
			fetchRequests() // Refresh the requests - this will move it to completed cases
		} catch (error) {
			console.error('Failed to complete job:', error)
			toast.error(t('my_cases.job_complete_error') || 'Failed to complete job')
		} finally {
			setIsCompleting(false)
		}
	}

	const openCompleteConfirm = (booking) => {
		setBookingToComplete(booking)
		setCompleteRating(0)
		setCompleteReviewText('')
		setCompleteConfirmOpen(true)
	}

	// Show loading state while checking auth
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				{t('common.loading')}
			</div>
		)
	}

	// If not authenticated or wrong role, redirect will happen
	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	const getStatusBadge = (status) => {
		const statusMap = {
			NEW: { label: t('my_cases.status.new'), variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
			IN_BIDDING: { label: t('my_cases.status.in_bidding'), variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
			BIDDING_CLOSED: { label: t('my_cases.status.bidding_closed'), variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
			BOOKED: { label: t('my_cases.status.booked'), variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
			COMPLETED: { label: t('my_cases.status.completed'), variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
			CANCELLED: { label: t('my_cases.status.cancelled'), variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' },
		}

		const statusInfo = statusMap[status] || {
			label: status,
			variant: 'default',
			className: 'bg-gray-100 text-gray-800 border-gray-200',
		}

		return (
			<Badge variant={statusInfo.variant} className={`${statusInfo.className} text-xs sm:text-sm`}>
				{statusInfo.label}
			</Badge>
		)
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'NEW':
			case 'IN_BIDDING':
				return <Clock className="w-4 h-4" />
			case 'BIDDING_CLOSED':
				return <AlertCircle className="w-4 h-4" />
			case 'BOOKED':
				return <Calendar className="w-4 h-4" />
			case 'COMPLETED':
				return <CheckCircle className="w-4 h-4" />
			case 'CANCELLED':
				return <XCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
						<Car className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading') || t('my_cases.loading_cases')}</p>
				</div>
			</div>
		)
	}

	// Filter requests based on active tab
	const filteredRequests = requests.filter((request) => {
		const bookings = request.bookings || []
		
		if (activeTab === 'my_cases') {
			// Show active requests (NEW, IN_BIDDING, BIDDING_CLOSED) - exclude CANCELLED
			return ['NEW', 'IN_BIDDING', 'BIDDING_CLOSED'].includes(request.status)
		} else if (activeTab === 'booked_cases') {
			// Show only booked requests (not rescheduled or cancelled)
			return request.status === 'BOOKED' && 
				!bookings.some(b => b.status === 'RESCHEDULED' || b.status === 'CANCELLED')
		} else if (activeTab === 'completed_cases') {
			// Show only completed requests where booking status is DONE (job actually completed from booked cases)
			return request.status === 'COMPLETED' && 
				bookings.some(b => b.status === 'DONE')
		} else if (activeTab === 'cancelled_cases') {
			// Show cancelled requests or requests with cancelled bookings
			return request.status === 'CANCELLED' || 
				bookings.some(b => b.status === 'CANCELLED')
		} else if (activeTab === 'rescheduled_cases') {
			// Show requests with rescheduled bookings
			return bookings.some(b => b.status === 'RESCHEDULED')
		}
		return false
	})

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			<Navbar />
			<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div>
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							{t('my_cases.title')}
						</h1>
						<p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
							{t('my_cases.subtitle')}
						</p>
					</div>
				</div>

				{/* Navigation Tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					<Button
						variant={activeTab === 'my_cases' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('my_cases')}
						className={activeTab === 'my_cases' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<Car className="w-4 h-4 mr-2" />
						{t('my_cases.my_cases_tab') || 'My Cases'}
					</Button>
					<Button
						variant={activeTab === 'booked_cases' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('booked_cases')}
						className={activeTab === 'booked_cases' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<Calendar className="w-4 h-4 mr-2" />
						{t('my_cases.booked_cases_tab') || 'Booked Cases'}
					</Button>
					<Button
						variant={activeTab === 'completed_cases' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('completed_cases')}
						className={activeTab === 'completed_cases' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<CheckCircle className="w-4 h-4 mr-2" />
						{t('my_cases.completed_cases_tab') || 'Completed Cases'}
					</Button>
					<Button
						variant={activeTab === 'cancelled_cases' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('cancelled_cases')}
						className={activeTab === 'cancelled_cases' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<XCircle className="w-4 h-4 mr-2" />
						{t('my_cases.cancelled_cases_tab') || 'Cancelled Cases'}
					</Button>
					<Button
						variant={activeTab === 'rescheduled_cases' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('rescheduled_cases')}
						className={activeTab === 'rescheduled_cases' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<RotateCcw className="w-4 h-4 mr-2" />
						{t('my_cases.rescheduled_cases_tab') || 'Rescheduled Cases'}
					</Button>
				</div>

				{filteredRequests.length === 0 ? (
					<Card className="border-0 shadow-xl overflow-hidden">
						<CardContent className="text-center py-12 sm:py-16 px-4 bg-gradient-to-br from-white to-gray-50">
							<div className="relative inline-block mb-6">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl animate-pulse"></div>
								<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-6 sm:p-8 rounded-2xl border-2 border-gray-200">
									{activeTab === 'completed_cases' ? (
										<CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#34C759' }} />
									) : activeTab === 'booked_cases' ? (
										<Calendar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
									) : activeTab === 'cancelled_cases' ? (
										<XCircle className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#ef4444' }} />
									) : activeTab === 'rescheduled_cases' ? (
										<RotateCcw className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
									) : (
										<Car className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
									)}
								</div>
							</div>
							<h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
									{activeTab === 'completed_cases' 
									? (t('my_cases.no_completed_cases.title') || 'No Completed Cases')
									: activeTab === 'booked_cases'
									? (t('my_cases.no_booked_cases.title') || 'No Booked Cases')
									: activeTab === 'cancelled_cases'
									? (t('my_cases.no_cancelled_cases.title') || 'No Cancelled Cases')
									: activeTab === 'rescheduled_cases'
									? (t('my_cases.no_rescheduled_cases.title') || 'No Rescheduled Cases')
									: t('my_cases.no_cases.title')
								}
							</h3>
							<p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
								{activeTab === 'completed_cases'
									? (t('my_cases.no_completed_cases.description') || 'You haven\'t completed any jobs yet.')
									: activeTab === 'booked_cases'
									? (t('my_cases.no_booked_cases.description') || 'You don\'t have any booked appointments yet.')
									: activeTab === 'cancelled_cases'
									? (t('my_cases.no_cancelled_cases.description') || 'You don\'t have any cancelled cases.')
									: activeTab === 'rescheduled_cases'
									? (t('my_cases.no_rescheduled_cases.description') || 'You don\'t have any rescheduled appointments.')
									: t('my_cases.no_cases.description')
								}
							</p>
							{activeTab === 'my_cases' && (
								<Link to="/upload" className="inline-block">
									<Button 
										size="default" 
										className="shadow-md hover:shadow-lg transition-all text-sm sm:text-base font-semibold"
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										<Car className="w-4 h-4 mr-2" />
										{t('my_cases.no_cases.button')}
									</Button>
								</Link>
							)}
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4 sm:space-y-6">
						{filteredRequests.map((request) => {
							// Handle both MongoDB _id and id formats
							const requestId = request._id || request.id
							const vehicle = request.vehicleId || request.vehicle
							const offers = request.offers || []
							const bookings = request.bookings || []

							return (
								<Card 
									key={requestId} 
									className="relative overflow-hidden border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300"
								>
									{/* Top Accent Bar */}
									<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1C3F94] via-[#34C759] to-[#1C3F94]"></div>

									<CardHeader className="relative pb-3 pt-4 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
										<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 sm:gap-3 mb-2">
													<div className="p-2 rounded-lg flex-shrink-0 shadow-md" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														{getStatusIcon(request.status)}
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-lg sm:text-xl font-bold text-gray-900 truncate mb-1">
															{vehicle?.make} {vehicle?.model} {vehicle?.year}
														</CardTitle>
														<CardDescription className="flex items-center gap-1.5 text-xs text-gray-600">
															<Calendar className="w-3.5 h-3.5 flex-shrink-0" />
															<span className="truncate">{t('my_cases.created')} {formatDate(new Date(request.createdAt))}</span>
														</CardDescription>
													</div>
												</div>
											</div>
											<div className="flex-shrink-0">
												{getStatusBadge(request.status)}
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
											{/* Vehicle Info */}
											<div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
												<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
													<div className="p-1 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														<Car className="w-3.5 h-3.5" />
													</div>
													{t('my_cases.vehicle_info')}
												</h4>
												<div className="space-y-1.5 pl-7">
													<div className="text-sm font-bold text-gray-900">
														{vehicle?.make} {vehicle?.model}
													</div>
													<div className="text-xs text-gray-600">
														<span className="font-medium">{t('my_cases.year')}:</span> {vehicle?.year}
													</div>
													{request.description && (
														<div className="pt-2 border-t border-gray-200">
															<p className="text-xs text-gray-600 italic">{request.description}</p>
														</div>
													)}
												</div>
											</div>

											{/* Offers - Hide in booked_cases and completed_cases tabs */}
											{activeTab !== 'booked_cases' && activeTab !== 'completed_cases' && (
												<div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
													<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
														<div className="p-1 rounded-lg bg-amber-100">
															<Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-600" />
														</div>
														{t('my_cases.offers')} 
														<span className="ml-2 px-2 py-0.5 rounded-full bg-[#1C3F94] text-white text-xs font-bold">
															{offers.length}
														</span>
													</h4>
													{offers.length === 0 ? (
														<div className="pl-7">
															<p className="text-xs text-gray-500 italic">{t('my_cases.no_offers')}</p>
														</div>
													) : (
														<div className="space-y-2 pl-7">
															{(() => {
																// For completed cases, show all offers and highlight the accepted one
																const offersToShow = activeTab === 'completed_cases' ? offers : offers.slice(0, 2)
																const acceptedOfferId = activeTab === 'completed_cases' && bookings.length > 0 
																	? (bookings[0].offerId?._id || bookings[0].offerId?.id || bookings[0].offerId)
																	: null
																
																return offersToShow.map((offer) => {
																	const offerId = offer._id || offer.id
																	const workshop = offer.workshopId || offer.workshop
																	const isAccepted = activeTab === 'completed_cases' && 
																		(offerId === acceptedOfferId || offer.status === 'ACCEPTED')
																	
																	return (
																		<div
																			key={offerId}
																			className={`flex justify-between items-center p-2.5 rounded-lg border hover:shadow-md transition-shadow ${
																				isAccepted 
																					? 'bg-green-50 border-green-300 border-2' 
																					: 'bg-white border-gray-200'
																			}`}
																		>
																			<div className="flex-1 min-w-0 pr-2">
																				<div className="flex items-center gap-2">
																					{workshop?.userId?.image || workshop?.user?.image ? (
																						<img 
																							src={getFullUrl(workshop?.userId?.image || workshop?.user?.image)} 
																							alt={workshop?.companyName || 'Workshop'} 
																							className="w-6 h-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
																							onError={(e) => {
																								e.target.style.display = 'none'
																								e.target.nextElementSibling.style.display = 'flex'
																							}}
																						/>
																					) : null}
																					<div className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 ${workshop?.userId?.image || workshop?.user?.image ? 'hidden' : ''}`}>
																						<Building2 className="w-3.5 h-3.5 text-white" />
																					</div>
																					<p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
																						{workshop?.companyName || 'Workshop'}
																					</p>
																					{isAccepted && (
																						<Badge className="bg-green-600 text-white border-0 text-xs px-2 py-0.5 font-semibold">
																							{t('my_cases.accepted') || 'Accepted'}
																						</Badge>
																					)}
																				</div>
																				{workshop?.rating && (
																					<div className="flex items-center gap-1.5 mt-1">
																						<Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
																						<span className="text-xs font-medium text-gray-700">
																							{workshop.rating.toFixed(1)}
																						</span>
																						{workshop.reviewCount && (
																							<span className="text-xs text-gray-500">
																								({workshop.reviewCount})
																							</span>
																						)}
																					</div>
																				)}
																			</div>
																			<div className="ml-2 flex-shrink-0">
																				<span className={`font-bold text-sm ${isAccepted ? 'text-green-700' : ''}`} style={!isAccepted ? { color: '#1C3F94' } : {}}>
																					{formatPrice(offer.price)}
																				</span>
																			</div>
																		</div>
																	)
																})
															})()}
															{activeTab !== 'completed_cases' && offers.length > 2 && (
																<div className="pt-1">
																	<p className="text-xs font-medium text-gray-500 text-center">
																		+{offers.length - 2} {t('my_cases.more_offers')}
																	</p>
																</div>
															)}
														</div>
													)}
												</div>
											)}

											{/* Contract With - Show in booked_cases tab */}
											{activeTab === 'booked_cases' && request.status === 'BOOKED' && bookings.length > 0 && bookings[0].workshopId && (
												<div className="relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
													{/* Decorative background pattern */}
													<div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
													<div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-100/30 rounded-full blur-2xl -ml-12 -mb-12"></div>
													
													<div className="relative z-10">
														<div className="flex items-center gap-3 mb-4">
															<div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#1C3F94' }}>
																<Building2 className="w-5 h-5 text-white" />
															</div>
															<h4 className="font-bold text-base sm:text-lg text-gray-900">
																{bookings[0].workshopId?.companyName || 'Workshop'}
															</h4>
														</div>
														
														<div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100 shadow-sm">
															<div className="flex items-start gap-3 mb-3">
																<div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
																	<Building2 className="w-5 h-5" style={{ color: '#1C3F94' }} />
																</div>
																<div className="flex-1 min-w-0">
																	{bookings[0].workshopId?.rating && (
																		<div className="flex items-center gap-2">
																			<div className="flex items-center gap-1">
																				<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
																				<span className="font-semibold text-sm text-gray-700">
																					{bookings[0].workshopId.rating.toFixed(1)}
																				</span>
																			</div>
																			{bookings[0].workshopId.reviewCount && (
																				<span className="text-xs text-gray-500">
																					({bookings[0].workshopId.reviewCount} {bookings[0].workshopId.reviewCount === 1 ? 'review' : 'reviews'})
																				</span>
																			)}
																		</div>
																	)}
																</div>
															</div>
															
															{/* Appointment Details */}
															<div className="mt-4 pt-4 border-t border-blue-100">
																<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
																	<div className="flex items-center gap-2 text-sm">
																		<div className="p-1.5 rounded-md bg-blue-100">
																			<Calendar className="w-4 h-4" style={{ color: '#1C3F94' }} />
																		</div>
																		<div>
																			<p className="text-xs text-gray-500 mb-0.5">Scheduled Date</p>
																			<p className="font-semibold text-gray-900 text-xs sm:text-sm">
																				{formatDateTime(new Date(bookings[0].scheduledAt))}
																			</p>
																		</div>
																	</div>
																	{bookings[0].totalAmount && (
																		<div className="flex items-center gap-2 text-sm">
																			<div className="p-1.5 rounded-md bg-green-100">
																				<Star className="w-4 h-4 text-green-600" />
																			</div>
																			<div>
																				<p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
																				<p className="font-bold text-green-700 text-sm sm:text-base">
																					{formatPrice(bookings[0].totalAmount)}
																				</p>
																			</div>
																		</div>
																	)}
																</div>
															</div>
														</div>
													</div>
												</div>
											)}

											{/* Actions */}
											<div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
												<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
													<div className="p-1 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
														<Clock className="w-3.5 h-3.5" />
													</div>
													{t('my_cases.actions')}
												</h4>
												<div className="space-y-2 pl-7">
													{(request.status === 'IN_BIDDING' || request.status === 'BIDDING_CLOSED') && (
														<Link to={`/offers?requestId=${requestId}`} className="block">
															<Button 
																size="sm" 
																className="w-full shadow-sm hover:shadow-md transition-all text-xs sm:text-sm font-semibold" 
																style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
															>
																<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
																{request.status === 'BIDDING_CLOSED' ? t('my_cases.choose_offer') : t('my_cases.see_details')}
															</Button>
														</Link>
													)}
													{request.status === 'IN_BIDDING' && (
														<div className="flex items-center gap-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
															<Clock className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
															<p>{t('my_cases.status.in_bidding')}</p>
														</div>
													)}


													{/* Show cancelled booking info in cancelled cases tab */}
													{activeTab === 'cancelled_cases' && bookings.length > 0 && bookings.some(b => b.status === 'CANCELLED') && (
														<div className="space-y-2 p-2.5 bg-white rounded-lg border border-red-200 mb-2">
															<p className="font-semibold text-xs text-red-900">{t('my_cases.cancelled_booking') || 'Cancelled Booking'}:</p>
															{bookings.filter(b => b.status === 'CANCELLED').map((booking) => (
																<div key={booking._id || booking.id} className="text-xs text-red-700">
																	<div className="flex items-center gap-2">
																		<Calendar className="w-3.5 h-3.5 flex-shrink-0" />
																		<span className="break-words">{formatDateTime(new Date(booking.scheduledAt))}</span>
																	</div>
																	<div className="flex items-center gap-2 text-xs font-bold text-red-900 mt-1">
																		<span>{formatPrice(booking.totalAmount)}</span>
																	</div>
																</div>
															))}
														</div>
													)}

													{/* Booked Cases Tab - Show Complete, Reschedule, Cancel buttons */}
													{activeTab === 'booked_cases' && request.status === 'BOOKED' && bookings.length > 0 && (
														<div className="flex flex-col items-center justify-center gap-3 mt-4">
															<Button 
																onClick={() => openCompleteConfirm(bookings[0])}
																size="sm" 
																className="w-full max-w-xs mx-auto shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-bold py-3 rounded-lg"
																style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
															>
																<CheckCircle className="w-5 h-5 mr-2" />
																{t('my_cases.complete_job') || 'Complete Job'}
															</Button>
															<Button 
																onClick={() => openRescheduleModal(bookings[0])}
																size="sm" 
																className="w-full max-w-xs mx-auto shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-bold py-3 rounded-lg"
																style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
															>
																<RotateCcw className="w-5 h-5 mr-2" />
																{t('my_cases.reschedule_job') || 'Reschedule Job'}
															</Button>
															<Button 
																onClick={() => openCancelConfirm(bookings[0])}
																size="sm" 
																variant="destructive"
																className="w-full max-w-xs mx-auto shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-bold py-3 rounded-lg"
															>
																<X className="w-5 h-5 mr-2" />
																{t('my_cases.cancel_job') || 'Cancel Job'}
															</Button>
														</div>
													)}

													{/* Completed Cases Tab - Simple Professional Design */}
													{activeTab === 'completed_cases' && request.status === 'COMPLETED' && bookings.length > 0 && bookings.some(b => b.status === 'DONE') && (
														<div className="mt-4">
															{(() => {
																const completedBooking = bookings.find(b => b.status === 'DONE') || bookings[0]
																const workshop = completedBooking?.workshopId || bookings[0]?.workshopId
																
																return (
																	<div className="space-y-4">
																		{/* Workshop Name and Rating */}
																		<div className="flex items-center gap-3">
																			<Building2 className="w-5 h-5" style={{ color: '#34C759' }} />
																			<div>
																				<h4 className="font-semibold text-base text-gray-900">
																					{workshop?.companyName || 'Workshop'}
																				</h4>
																				{workshop?.rating && (
																					<div className="flex items-center gap-1.5 mt-1">
																						<Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
																						<span className="text-sm text-gray-700">
																							{workshop.rating.toFixed(1)}
																						</span>
																						{workshop.reviewCount && (
																							<span className="text-xs text-gray-500">
																								({workshop.reviewCount})
																							</span>
																						)}
																					</div>
																				)}
																			</div>
																		</div>

																		{/* Details */}
																		<div className="space-y-2 pl-8">
																			{completedBooking.scheduledAt && (
																				<div className="flex items-center gap-2 text-sm text-gray-600">
																					<Calendar className="w-4 h-4 text-gray-400" />
																					<span>{formatDateTime(new Date(completedBooking.scheduledAt))}</span>
																				</div>
																			)}
																			{completedBooking.totalAmount && (
																				<div className="flex items-center gap-2 text-sm">
																					<span className="text-gray-600">Amount:</span>
																					<span className="font-semibold" style={{ color: '#34C759' }}>
																						{formatPrice(completedBooking.totalAmount)}
																					</span>
																				</div>
																			)}
																		</div>
																	</div>
																)
															})()}
														</div>
													)}

													{/* Rescheduled Cases Tab - Show Reschedule and Cancel buttons */}
													{activeTab === 'rescheduled_cases' && bookings.length > 0 && bookings.some(b => b.status === 'RESCHEDULED') && (
														<div className="space-y-2">
															{bookings.filter(b => b.status === 'RESCHEDULED').map((booking) => (
																<div key={booking._id || booking.id} className="space-y-2">
																	<div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 mb-2">
																		<p className="font-semibold text-xs text-blue-900 mb-1">{t('my_cases.rescheduled_for') || 'Rescheduled for'}:</p>
																		<div className="flex items-center gap-2 text-xs text-blue-700">
																			<Calendar className="w-3.5 h-3.5 flex-shrink-0" />
																			<span className="break-words">{formatDateTime(new Date(booking.scheduledAt))}</span>
																		</div>
																	</div>
																	<Button 
																		onClick={() => openRescheduleModal(booking)}
																		size="sm" 
																		className="w-full shadow-sm hover:shadow-md transition-all text-xs sm:text-sm font-semibold"
																		style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
																	>
																		<RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
																		{t('my_cases.reschedule_again') || 'Reschedule Again'}
																	</Button>
																	<Button 
																		onClick={() => openCancelConfirm(booking)}
																		size="sm" 
																		variant="destructive"
																		className="w-full shadow-sm hover:shadow-md transition-all text-xs sm:text-sm font-semibold"
																	>
																		<X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
																		{t('my_cases.cancel_job') || 'Cancel Job'}
																	</Button>
																</div>
															))}
														</div>
													)}

													{/* Cancelled Cases Tab - Show View Details button */}
													{activeTab === 'cancelled_cases' && (
														<Link to={`/offers?requestId=${requestId}`} className="block">
															<Button 
																size="sm" 
																className="w-full shadow-sm hover:shadow-md transition-all text-xs sm:text-sm font-semibold" 
																style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
															>
																<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
																{t('my_cases.view_details') || 'View Details'}
															</Button>
														</Link>
													)}
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}

				{/* Complete Job Confirmation Modal with Rating and Review */}
				<Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
					<DialogContent onClose={() => setCompleteConfirmOpen(false)}>
						<DialogTitle>{t('my_cases.complete_job_confirm_title') || 'Complete Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.complete_job_confirm_description') || 'Please rate and review the service before completing the job.'}
						</DialogDescription>
						
						{/* Workshop Name */}
						{bookingToComplete && (() => {
							const bookingId = bookingToComplete._id || bookingToComplete.id
							const request = requests.find(r => r.bookings?.some(b => (b._id || b.id) === bookingId))
							const booking = request?.bookings?.find(b => (b._id || b.id) === bookingId) || bookingToComplete
							const workshopName = booking?.workshopId?.companyName || bookingToComplete?.workshopId?.companyName || 'Workshop'
							
							return workshopName !== 'Workshop' || booking?.workshopId || bookingToComplete?.workshopId ? (
								<div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg border border-blue-200">
									<div className="flex items-center gap-2">
										<Building2 className="w-5 h-5" style={{ color: '#1C3F94' }} />
										<div>
											<p className="text-xs text-gray-600 mb-0.5">Contract with</p>
											<p className="font-bold text-sm text-gray-900">
												{workshopName}
											</p>
										</div>
									</div>
								</div>
							) : null
						})()}
						
						<div className="space-y-4 pt-4">
							{/* Rating Section */}
							<div>
								<Label className="text-sm font-semibold mb-2 block">
									{t('my_cases.rating') || 'Rating'} *
								</Label>
								<div className="flex items-center gap-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type="button"
											onClick={() => setCompleteRating(star)}
											className="focus:outline-none transition-transform hover:scale-110"
											disabled={isCompleting}
										>
											<Star
												className={`w-8 h-8 ${
													star <= completeRating
														? 'fill-yellow-400 text-yellow-400'
														: 'text-gray-300'
												}`}
											/>
										</button>
									))}
									{completeRating > 0 && (
										<span className="text-sm text-gray-600 ml-2">
											{completeRating} {completeRating === 1 ? 'star' : 'stars'}
										</span>
									)}
								</div>
							</div>

							{/* Review Text Section */}
							<div>
								<Label htmlFor="completeReviewText" className="text-sm font-semibold mb-2 block">
									{t('my_cases.review') || 'Review'} *
								</Label>
								<Textarea
									id="completeReviewText"
									value={completeReviewText}
									onChange={(e) => setCompleteReviewText(e.target.value)}
									placeholder={t('my_cases.review_placeholder') || 'Share your experience with this service...'}
									className="min-h-[100px]"
									disabled={isCompleting}
								/>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										setCompleteConfirmOpen(false)
										setBookingToComplete(null)
										setCompleteRating(0)
										setCompleteReviewText('')
									}}
									className="flex-1"
									disabled={isCompleting}
								>
									{t('common.cancel') || 'Cancel'}
								</Button>
								<Button
									onClick={handleCompleteJob}
									disabled={isCompleting}
									className="flex-1 font-semibold"
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									{isCompleting ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
											{t('my_cases.completing') || 'Completing...'}
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4 mr-2" />
											{t('my_cases.confirm_complete') || 'Confirm Complete'}
										</>
									)}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				{/* Cancel Confirmation Modal */}
				<Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
					<DialogContent onClose={() => setCancelConfirmOpen(false)}>
						<DialogTitle>{t('my_cases.cancel_job_confirm_title') || 'Cancel Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.cancel_job_confirm_description') || 'Are you sure you want to cancel this job? This action cannot be undone.'}
						</DialogDescription>
						<div className="flex gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => {
									setCancelConfirmOpen(false)
									setBookingToCancel(null)
								}}
								className="flex-1"
								disabled={isCancelling}
							>
								{t('common.cancel') || 'Cancel'}
							</Button>
							<Button
								onClick={handleCancelJob}
								disabled={isCancelling}
								variant="destructive"
								className="flex-1 font-semibold"
							>
								{isCancelling ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
										{t('my_cases.cancelling') || 'Cancelling...'}
									</>
								) : (
									<>
										<XCircle className="w-4 h-4 mr-2" />
										{t('my_cases.confirm_cancel') || 'Confirm Cancel'}
									</>
								)}
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{/* Reschedule Modal */}
				<Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
					<DialogContent onClose={() => setRescheduleModalOpen(false)}>
						<DialogTitle>{t('my_cases.reschedule_job_title') || 'Reschedule Job'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.reschedule_job_description') || 'Select a new date and time for your appointment'}
						</DialogDescription>
						{selectedBookingForReschedule && (
							<div className="space-y-4">
								{/* Current Booking Info */}
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-xs font-semibold text-gray-600 mb-1">
										{t('my_cases.current_appointment') || 'Current Appointment'}
									</p>
									<p className="text-sm font-semibold text-gray-900">
										{formatDateTime(new Date(selectedBookingForReschedule.scheduledAt))}
									</p>
								</div>

								{/* New Date */}
								<div>
									<Label htmlFor="newDate" className="text-sm font-semibold mb-2 block">
										{t('my_cases.new_date') || 'New Date'} *
									</Label>
									<Input
										id="newDate"
										type="date"
										value={newScheduledDate}
										onChange={(e) => setNewScheduledDate(e.target.value)}
										min={new Date().toISOString().split('T')[0]}
										className="w-full"
									/>
								</div>

								{/* New Time */}
								<div>
									<Label htmlFor="newTime" className="text-sm font-semibold mb-2 block">
										{t('my_cases.new_time') || 'New Time'} *
									</Label>
									<Input
										id="newTime"
										type="time"
										value={newScheduledTime}
										onChange={(e) => setNewScheduledTime(e.target.value)}
										className="w-full"
									/>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 pt-2">
									<Button
										variant="outline"
										onClick={() => {
											setRescheduleModalOpen(false)
											setSelectedBookingForReschedule(null)
											setNewScheduledDate('')
											setNewScheduledTime('')
										}}
										className="flex-1"
										disabled={isRescheduling}
									>
										{t('common.cancel') || 'Cancel'}
									</Button>
									<Button
										onClick={handleRescheduleJob}
										disabled={!newScheduledDate || !newScheduledTime || isRescheduling}
										className="flex-1 font-semibold"
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										{isRescheduling ? (
											<>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
												{t('my_cases.rescheduling') || 'Rescheduling...'}
											</>
										) : (
											<>
												<RotateCcw className="w-4 h-4 mr-2" />
												{t('my_cases.confirm_reschedule') || 'Confirm Reschedule'}
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Review Modal */}
				<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
					<DialogContent onClose={() => setReviewModalOpen(false)}>
						<DialogTitle>{t('my_cases.review_title') || 'Rate Your Experience'}</DialogTitle>
						<DialogDescription>
							{t('my_cases.review_description') || 'Please share your experience with this workshop'}
						</DialogDescription>
						{selectedRequestForReview && (
							<div className="space-y-4">
								{/* Workshop Info */}
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-sm font-semibold text-gray-900">
										{selectedRequestForReview.bookings?.[0]?.workshopId?.companyName || 
										 selectedRequestForReview.bookings?.[0]?.workshop?.companyName || 
										 'Workshop'}
									</p>
								</div>

								{/* Star Rating */}
								<div>
									<Label className="text-sm font-semibold mb-2 block">
										{t('my_cases.rating') || 'Rating'} *
									</Label>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((star) => (
											<button
												key={star}
												type="button"
												onClick={() => setRating(star)}
												className="focus:outline-none transition-transform hover:scale-110"
											>
												<Star
													className={`w-8 h-8 ${
														star <= rating
															? 'fill-yellow-400 text-yellow-400'
															: 'fill-gray-300 text-gray-300'
													}`}
												/>
											</button>
										))}
									</div>
									{rating > 0 && (
										<p className="text-xs text-gray-600 mt-1">
											{rating === 1 && (t('my_cases.rating_1') || 'Poor')}
											{rating === 2 && (t('my_cases.rating_2') || 'Fair')}
											{rating === 3 && (t('my_cases.rating_3') || 'Good')}
											{rating === 4 && (t('my_cases.rating_4') || 'Very Good')}
											{rating === 5 && (t('my_cases.rating_5') || 'Excellent')}
										</p>
									)}
								</div>

								{/* Review Text */}
								<div>
									<Label htmlFor="reviewText" className="text-sm font-semibold mb-2 block">
										{t('my_cases.review_text') || 'Your Review'} *
									</Label>
									<Textarea
										id="reviewText"
										value={reviewText}
										onChange={(e) => setReviewText(e.target.value)}
										placeholder={t('my_cases.review_placeholder') || 'Share your experience...'}
										rows={4}
										className="w-full"
									/>
								</div>

								{/* Buttons */}
								<div className="flex gap-3 pt-2">
									<Button
										variant="outline"
										onClick={() => {
											setReviewModalOpen(false)
											setSelectedRequestForReview(null)
											setRating(0)
											setReviewText('')
										}}
										className="flex-1"
									>
										{t('common.cancel') || 'Cancel'}
									</Button>
									<Button
										onClick={handleSubmitReview}
										disabled={!rating || !reviewText.trim() || isSubmittingReview}
										className="flex-1 font-semibold"
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										{isSubmittingReview ? (
											<>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
												{t('my_cases.submitting') || 'Submitting...'}
											</>
										) : (
											<>
												<CheckCircle className="w-4 h-4 mr-2" />
												{t('my_cases.confirm_review') || 'Confirm'}
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
