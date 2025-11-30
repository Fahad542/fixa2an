import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { offersAPI, bookingsAPI } from '../services/api'
import {
	Star,
	MapPin,
	Clock,
	CheckCircle,
	Car,
	AlertCircle,
	Calendar,
} from 'lucide-react'

export default function OffersPage() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	
	const requestId = searchParams.get('requestId')
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [sortBy, setSortBy] = useState('price')
	const [selectedOffer, setSelectedOffer] = useState(null)
	const [bookingModalOpen, setBookingModalOpen] = useState(false)
	const [detailsModalOpen, setDetailsModalOpen] = useState(false)
	const [selectedOfferForDetails, setSelectedOfferForDetails] = useState(null)
	const [scheduledAt, setScheduledAt] = useState('')
	const [bookingNotes, setBookingNotes] = useState('')
	const [isBooking, setIsBooking] = useState(false)

	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'CUSTOMER') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else if (user.role === 'WORKSHOP') {
					navigate('/workshop/requests', { replace: true })
				} else {
					navigate('/my-cases', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (requestId && user && user.role === 'CUSTOMER') {
			fetchOffers()
		}
	}, [requestId, user, sortBy])

	const fetchOffers = async () => {
		if (!requestId) return

		setLoading(true)
		try {
			const response = await offersAPI.getByRequest(requestId, { sortBy })
			if (response.data) {
				setOffers(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch offers:', error)
			toast.error(t('errors.fetch_failed') || 'Failed to fetch offers')
		} finally {
			setLoading(false)
		}
	}

	const handleAcceptOffer = (offer) => {
		setSelectedOffer(offer)
		setBookingModalOpen(true)
	}

	const handleViewDetails = (offer) => {
		setSelectedOfferForDetails(offer)
		setDetailsModalOpen(true)
	}

	const handleBooking = async () => {
		if (!selectedOffer || !scheduledAt) {
			toast.error(t('offers_page.booking_date_required') || 'Please select a date and time')
			return
		}

		setIsBooking(true)
		try {
			const response = await bookingsAPI.create({
				offerId: selectedOffer._id || selectedOffer.id,
				scheduledAt: new Date(scheduledAt).toISOString(),
				notes: bookingNotes,
			})

			if (response.data) {
				toast.success(t('offers_page.booking_success') || 'Booking created successfully!')
				setBookingModalOpen(false)
				setSelectedOffer(null)
				setScheduledAt('')
				setBookingNotes('')
				// Refresh offers to update status
				fetchOffers()
				// Navigate to my cases after a short delay
				setTimeout(() => {
					navigate('/my-cases')
				}, 1500)
			}
		} catch (error) {
			console.error('Failed to create booking:', error)
			toast.error(error.response?.data?.message || t('offers_page.booking_error') || 'Failed to create booking')
		} finally {
			setIsBooking(false)
		}
	}

	if (!requestId) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
				<Navbar />
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
					<Card className="border-0 shadow-lg">
						<CardContent className="text-center py-12">
							<AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
							<h3 className="text-xl font-bold text-gray-900 mb-2">Request ID Required</h3>
							<p className="text-gray-600 mb-4">Please select a request to view offers.</p>
							<Link to="/my-cases">
								<Button>Go to My Cases</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-[#1C3F94]/20 border-t-[#1C3F94] rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600 font-medium">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	// Sort offers
	const sortedOffers = [...offers].sort((a, b) => {
		switch (sortBy) {
			case 'price':
				return a.price - b.price
			case 'rating':
				return (b.workshop?.rating || 0) - (a.workshop?.rating || 0)
			case 'distance':
				return (a.distance || 0) - (b.distance || 0)
			default:
				return 0
		}
	})

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
			<Navbar />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
						<div className="flex items-center gap-2 sm:gap-3">
							<div className="p-2 bg-[#1C3F94] rounded-lg shadow-md">
								<Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
							</div>
							<div>
								<h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
									{t('offers_page.title') || 'Offers for Your Request'}
								</h1>
								<p className="text-xs sm:text-sm text-gray-600">
									{t('offers_page.subtitle') || 'Compare offers from different workshops'}
								</p>
							</div>
						</div>
						<div className="w-full sm:w-auto">
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#1C3F94] focus:ring-2 focus:ring-[#1C3F94]/20 outline-none bg-white shadow-sm font-medium text-sm"
							>
								<option value="price">{t('offers_page.sort_by_price') || 'Sort by Price'}</option>
								<option value="rating">{t('offers_page.sort_by_rating') || 'Sort by Rating'}</option>
								<option value="distance">{t('offers_page.sort_by_distance') || 'Sort by Distance'}</option>
							</select>
						</div>
					</div>
				</div>

				{/* Offers List */}
				{sortedOffers.length === 0 ? (
					<Card className="border-0 shadow-lg overflow-hidden">
						<CardContent className="text-center py-12 sm:py-16 px-6 bg-gradient-to-br from-white to-gray-50">
							<div className="relative inline-block mb-6">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl animate-pulse"></div>
								<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-6 sm:p-8 rounded-2xl border-2 border-gray-200">
									<Star className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
								</div>
							</div>
							<h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
								{t('offers_page.no_offers') || 'No Offers Yet'}
							</h3>
							<p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
								{t('offers_page.no_offers_description') || 'No workshops have submitted offers for this request yet.'}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4 sm:space-y-6">
						{sortedOffers.map((offer) => {
							const offerId = offer._id || offer.id
							const workshop = offer.workshopId || offer.workshop

							return (
								<Card
									key={offerId}
									className="relative overflow-hidden border-0 shadow-lg bg-white"
								>
									{/* Top Accent Bar */}
									<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1C3F94] via-[#34C759] to-[#1C3F94]"></div>

									<CardHeader className="relative pb-2 pt-3 px-4 sm:px-5 bg-gradient-to-br from-gray-50 to-white">
										<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1.5">
													<div className="p-1.5 rounded-lg flex-shrink-0 shadow-md" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														<Car className="w-4 h-4" />
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
															{workshop?.companyName || 'Workshop'}
														</CardTitle>
														<div className="flex flex-wrap items-center gap-1.5">
															{workshop?.isVerified && (
																<Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 text-xs px-2 py-0.5 font-semibold shadow-sm">
																	<CheckCircle className="w-3 h-3 mr-1" />
																	{t('offers_page.verified') || 'Verified'}
																</Badge>
															)}
															{workshop?.rating && (
																<div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg border border-amber-200">
																	<Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
																	<span className="font-bold text-xs text-gray-900">{workshop.rating.toFixed(1)}</span>
																	{workshop.reviewCount && (
																		<span className="text-xs text-gray-600">({workshop.reviewCount})</span>
																	)}
																</div>
															)}
														</div>
													</div>
												</div>
											</div>
											<div className="text-right flex-shrink-0">
												<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{t('offers_page.price') || 'Price'}</div>
												<div className="text-xl sm:text-2xl font-extrabold" style={{ color: '#1C3F94' }}>
													{formatPrice(offer.price)}
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-3 px-4 sm:px-5 pb-3 sm:pb-4">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-3">
											{(offer.estimatedDuration || offer.warranty) && (
												<div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
													<div className="flex items-center gap-1.5 mb-1">
														<div className="p-0.5 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
															<Clock className="w-3 h-3" />
														</div>
														<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
															{offer.estimatedDuration && offer.warranty 
																? `${t('offers_page.estimated_duration') || 'Estimated Duration'} & ${t('offers_page.warranty') || 'Warranty'}`
																: offer.estimatedDuration 
																	? t('offers_page.estimated_duration') || 'Estimated Duration'
																	: t('offers_page.warranty') || 'Warranty'
															}
														</h4>
													</div>
													<div className="space-y-0.5">
														{offer.estimatedDuration && (
															<p className="text-sm font-bold text-gray-900">
																{offer.estimatedDuration} {t('offers_page.minutes') || 'minutes'}
															</p>
														)}
														{offer.warranty && (
															<p className="text-xs font-semibold text-gray-700">
																{t('offers_page.warranty') || 'Warranty'}: {offer.warranty}
															</p>
														)}
													</div>
												</div>
											)}
											{offer.distance && (
												<div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
													<div className="flex items-center gap-1.5 mb-1">
														<div className="p-0.5 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
															<MapPin className="w-3 h-3" />
														</div>
														<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('offers_page.distance') || 'Distance'}</h4>
													</div>
													<p className="text-sm font-bold text-gray-900">{offer.distance.toFixed(1)} km</p>
												</div>
											)}
											{workshop?.city && (
												<div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
													<div className="flex items-center gap-1.5 mb-1">
														<div className="p-0.5 rounded-lg bg-purple-100">
															<MapPin className="w-3 h-3" style={{ color: '#1C3F94' }} />
														</div>
														<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('offers_page.location') || 'Location'}</h4>
													</div>
													<p className="text-sm font-bold text-gray-900">{workshop.city}</p>
												</div>
											)}
										</div>
										{offer.note && (
											<div className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 mb-3">
												<p className="text-xs text-gray-700 leading-relaxed italic">"{offer.note}"</p>
											</div>
										)}
										{offer.status === 'ACCEPTED' && (
											<Badge className="bg-green-600 text-white border-0 text-xs px-2.5 py-1 font-semibold mb-3">
												{t('offers_page.accepted') || 'Accepted'}
											</Badge>
										)}
									</CardContent>
									{offer.status !== 'ACCEPTED' && (
										<div className="px-4 sm:px-5 pb-3 sm:pb-4 pt-2 border-t border-gray-200 flex justify-end">
											<Button 
												onClick={() => handleAcceptOffer(offer)}
												className="shadow-md hover:shadow-lg transition-all font-semibold py-1.5 px-4 text-xs"
												style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
											>
												<CheckCircle className="w-3 h-3 mr-1.5" />
												{t('offers_page.accept_offer') || 'Accept Offer'}
											</Button>
										</div>
									)}
								</Card>
							)
						})}
					</div>
				)}

				{/* Booking Modal */}
				<Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
					<DialogContent onClose={() => setBookingModalOpen(false)}>
						<DialogTitle>{t('offers_page.book_appointment') || 'Book Appointment'}</DialogTitle>
						<DialogDescription>
							{t('offers_page.book_appointment_desc') || 'Select a date and time for your appointment'}
						</DialogDescription>
						{selectedOffer && (
							<div className="space-y-4">
								<div className="p-3 bg-gray-50 rounded-lg">
									<p className="text-sm font-semibold text-gray-900 mb-1">
										{selectedOffer.workshopId?.companyName || selectedOffer.workshop?.companyName || 'Workshop'}
									</p>
									<p className="text-lg font-bold" style={{ color: '#1C3F94' }}>
										{formatPrice(selectedOffer.price)}
									</p>
								</div>
								<div>
									<Label htmlFor="scheduledAt" className="text-sm font-semibold">
										{t('offers_page.select_date_time') || 'Select Date & Time'} *
									</Label>
									<Input
										id="scheduledAt"
										type="datetime-local"
										value={scheduledAt}
										onChange={(e) => setScheduledAt(e.target.value)}
										className="mt-1"
										min={new Date().toISOString().slice(0, 16)}
									/>
								</div>
								<div>
									<Label htmlFor="notes" className="text-sm font-semibold">
										{t('offers_page.notes') || 'Notes (Optional)'}
									</Label>
									<textarea
										id="notes"
										value={bookingNotes}
										onChange={(e) => setBookingNotes(e.target.value)}
										className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] outline-none"
										rows={3}
										placeholder={t('offers_page.notes_placeholder') || 'Add any special instructions...'}
									/>
								</div>
								<div className="flex gap-3 pt-2">
									<Button
										variant="outline"
										onClick={() => {
											setBookingModalOpen(false)
											setSelectedOffer(null)
											setScheduledAt('')
											setBookingNotes('')
										}}
										className="flex-1"
									>
										{t('common.cancel') || 'Cancel'}
									</Button>
									<Button
										onClick={handleBooking}
										disabled={!scheduledAt || isBooking}
										className="flex-1 font-semibold"
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										{isBooking ? (
											<>
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block"></div>
												{t('offers_page.booking') || 'Booking...'}
											</>
										) : (
											<>
												<Calendar className="w-4 h-4 mr-2" />
												{t('offers_page.confirm_booking') || 'Confirm Booking'}
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Details Modal */}
				<Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
					<DialogContent onClose={() => setDetailsModalOpen(false)}>
						<DialogTitle>{t('offers_page.offer_details') || 'Offer Details'}</DialogTitle>
						{selectedOfferForDetails && (
							<div className="space-y-4">
								<div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
									<h3 className="font-bold text-lg text-gray-900 mb-3">
										{selectedOfferForDetails.workshopId?.companyName || selectedOfferForDetails.workshop?.companyName || 'Workshop'}
									</h3>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-xs text-gray-500 mb-1">{t('offers_page.price') || 'Price'}</p>
											<p className="text-lg font-bold" style={{ color: '#1C3F94' }}>
												{formatPrice(selectedOfferForDetails.price)}
											</p>
										</div>
										{selectedOfferForDetails.estimatedDuration && (
											<div>
												<p className="text-xs text-gray-500 mb-1">{t('offers_page.estimated_duration') || 'Duration'}</p>
												<p className="text-sm font-semibold text-gray-900">
													{selectedOfferForDetails.estimatedDuration} {t('offers_page.minutes') || 'minutes'}
												</p>
											</div>
										)}
										{selectedOfferForDetails.distance && (
											<div>
												<p className="text-xs text-gray-500 mb-1">{t('offers_page.distance') || 'Distance'}</p>
												<p className="text-sm font-semibold text-gray-900">
													{selectedOfferForDetails.distance.toFixed(1)} km
												</p>
											</div>
										)}
										{selectedOfferForDetails.warranty && (
											<div>
												<p className="text-xs text-gray-500 mb-1">{t('offers_page.warranty') || 'Warranty'}</p>
												<p className="text-sm font-semibold text-gray-900">{selectedOfferForDetails.warranty}</p>
											</div>
										)}
									</div>
								</div>
								{selectedOfferForDetails.note && (
									<div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
										<p className="text-xs text-gray-500 mb-2">{t('offers_page.notes') || 'Notes'}</p>
										<p className="text-sm text-gray-700 italic">"{selectedOfferForDetails.note}"</p>
									</div>
								)}
								{(selectedOfferForDetails.workshopId || selectedOfferForDetails.workshop) && (
									<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
										<p className="text-xs text-gray-500 mb-2">{t('offers_page.workshop_info') || 'Workshop Information'}</p>
										<p className="text-sm font-semibold text-gray-900">
											{selectedOfferForDetails.workshopId?.companyName || selectedOfferForDetails.workshop?.companyName}
										</p>
										{(selectedOfferForDetails.workshopId?.city || selectedOfferForDetails.workshop?.city) && (
											<p className="text-xs text-gray-600 mt-1">
												{selectedOfferForDetails.workshopId?.city || selectedOfferForDetails.workshop?.city}
											</p>
										)}
									</div>
								)}
								<Button
									onClick={() => {
										setDetailsModalOpen(false)
										handleAcceptOffer(selectedOfferForDetails)
									}}
									className="w-full font-semibold"
									style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
								>
									{t('offers_page.accept_offer') || 'Accept Offer'}
								</Button>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}

