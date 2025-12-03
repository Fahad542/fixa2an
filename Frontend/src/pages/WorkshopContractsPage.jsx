import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/Dialog'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	Car,
	Calendar,
	CheckCircle,
	User,
	Phone,
	Mail,
	DollarSign,
	FileText,
	X,
	AlertTriangle,
	Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { offersAPI, bookingsAPI } from '../services/api'

export default function WorkshopContractsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [contracts, setContracts] = useState([])
	const [bookings, setBookings] = useState([])
	const [loading, setLoading] = useState(true)
	const [cancellingId, setCancellingId] = useState(null)
	const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [contractToCancel, setContractToCancel] = useState(null)
	const [activeTab, setActiveTab] = useState('current')

	// Redirect if not authenticated or wrong role
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'WORKSHOP') {
				if (user.role === 'ADMIN') {
					navigate('/admin', { replace: true })
				} else {
					navigate('/my-cases', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchContracts = async () => {
		if (!user || user.role !== 'WORKSHOP') {
			setLoading(false)
			return
		}

		try {
			// Fetch accepted offers (contracts) - these are proposals that customer accepted
			const response = await offersAPI.getByWorkshop()
			
			if (response.data) {
				const allOffers = Array.isArray(response.data) ? response.data : []
				// Filter only accepted offers (contracts)
				const accepted = allOffers.filter(offer => offer.status === 'ACCEPTED')
				setContracts(accepted)
			}
			
			// Fetch bookings separately to check completion status
			try {
				const bookingsResponse = await bookingsAPI.getByWorkshopMe()
				if (bookingsResponse.data) {
					const allBookings = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []
					setBookings(allBookings)
				}
			} catch (bookingsError) {
				console.warn('Failed to fetch bookings:', bookingsError)
				setBookings([])
			}
		} catch (error) {
			console.error('Failed to fetch contracts:', error)
			toast.error(t('workshop.contracts.fetch_error') || 'Failed to fetch contracts')
			setContracts([])
			setBookings([])
		} finally {
			setLoading(false)
		}
	}

	// Filter contracts based on active tab
	const getFilteredContracts = () => {
		if (activeTab === 'current') {
			// Current contracts: ACCEPTED offers where booking is NOT DONE AND request is NOT COMPLETED
			// When offer is accepted, it shows in current contracts
			// When customer completes job, booking status becomes 'DONE' and request status becomes 'COMPLETED'
			// Contract should then move to completed tab
			return contracts.filter(offer => {
				const offerId = offer._id || offer.id
				if (!offerId) return false
				
				// Find matching booking by offerId
				const booking = bookings.find(b => {
					let bookingOfferId = null
					if (b.offerId && typeof b.offerId === 'object' && b.offerId !== null) {
						bookingOfferId = b.offerId._id || b.offerId.id
					} else if (b.offerId) {
						bookingOfferId = b.offerId
					}
					if (!bookingOfferId) return false
					return String(bookingOfferId) === String(offerId)
				})
				
				// Check booking status
				const bookingStatus = booking?.status?.toUpperCase()
				const isBookingDone = booking && bookingStatus === 'DONE'
				
				// Check request status (when booking is DONE, request status becomes COMPLETED)
				const request = offer.requestId || offer.request
				const requestStatus = request?.status?.toUpperCase()
				const isRequestCompleted = requestStatus === 'COMPLETED'
				
				// Show in current ONLY if:
				// 1. Booking is NOT DONE, AND
				// 2. Request is NOT COMPLETED
				// If either is true, it should show in completed tab
				return !isBookingDone && !isRequestCompleted
			})
		} else {
			// Completed contracts: ACCEPTED offers where booking status is DONE OR request status is COMPLETED
			// When customer completes job, booking status becomes 'DONE' and request status becomes 'COMPLETED'
			return contracts.filter(offer => {
				const offerId = offer._id || offer.id
				if (!offerId) return false
				
				// Find matching booking by offerId
				const booking = bookings.find(b => {
					let bookingOfferId = null
					if (b.offerId && typeof b.offerId === 'object' && b.offerId !== null) {
						bookingOfferId = b.offerId._id || b.offerId.id
					} else if (b.offerId) {
						bookingOfferId = b.offerId
					}
					if (!bookingOfferId) return false
					return String(bookingOfferId) === String(offerId)
				})
				
				// Check booking status
				const bookingStatus = booking?.status?.toUpperCase()
				const isBookingDone = booking && bookingStatus === 'DONE'
				
				// Check request status (when booking is DONE, request status becomes COMPLETED)
				const request = offer.requestId || offer.request
				const requestStatus = request?.status?.toUpperCase()
				const isRequestCompleted = requestStatus === 'COMPLETED'
				
				// Show if booking is DONE OR request is COMPLETED
				return isBookingDone || isRequestCompleted
			})
		}
	}

	const filteredContracts = getFilteredContracts()

	const handleCancelClick = (offerId) => {
		setContractToCancel(offerId)
		setShowCancelDialog(true)
	}

	const handleCancelConfirm = async () => {
		if (!contractToCancel) return

		setCancellingId(contractToCancel)
		setShowCancelDialog(false)
		
		try {
			// Update offer status to DECLINED (cancelled by workshop)
			await offersAPI.update(contractToCancel, { status: 'DECLINED' })
			toast.success(t('workshop.contracts.cancelled') || 'Contract cancelled successfully')
			// Refresh contracts list
			fetchContracts()
		} catch (error) {
			console.error('Failed to cancel contract:', error)
			toast.error(error.response?.data?.message || t('workshop.contracts.cancel_error') || 'Failed to cancel contract')
		} finally {
			setCancellingId(null)
			setContractToCancel(null)
		}
	}

	const handleCancelDialogClose = () => {
		setShowCancelDialog(false)
		setContractToCancel(null)
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchContracts()
		}
	}, [user])

	// Refresh data when tab changes to get latest booking status
	useEffect(() => {
		if (user && user.role === 'WORKSHOP' && !loading) {
			fetchContracts()
		}
	}, [activeTab])

	// Refresh data when page comes into focus (in case customer completed job while workshop had page open)
	useEffect(() => {
		const handleFocus = () => {
			if (user && user.role === 'WORKSHOP' && document.visibilityState === 'visible') {
				fetchContracts()
			}
		}
		
		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleFocus)
		
		return () => {
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleFocus)
		}
	}, [user])

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
						<FileText className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			
			{/* Cancel Confirmation Dialog */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent onClose={handleCancelDialogClose}>
					<div className="flex items-start gap-4">
						<div className="p-3 bg-red-100 rounded-full flex-shrink-0">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<div className="flex-1">
							<DialogTitle>Cancel Contract</DialogTitle>
							<DialogDescription>
								{t('workshop.contracts.cancel_confirm') || 'Are you sure you want to cancel this contract? This action cannot be undone.'}
							</DialogDescription>
							<div className="flex gap-3 mt-6">
								<Button
									variant="destructive"
									onClick={handleCancelConfirm}
									className="flex-1"
								>
									Yes, Cancel Contract
								</Button>
								<Button
									variant="outline"
									onClick={handleCancelDialogClose}
									className="flex-1"
								>
									No, Keep It
								</Button>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			
			<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div>
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							{t('workshop.contracts.title') || 'Contracts'}
						</h1>
						<p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
							{t('workshop.contracts.subtitle') || 'Contracts with customers who accepted your proposals'}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					<Button
						variant={activeTab === 'current' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('current')}
						className={activeTab === 'current' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<Clock className="w-4 h-4 mr-2" />
						Current
					</Button>
					<Button
						variant={activeTab === 'completed' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('completed')}
						className={activeTab === 'completed' ? 'bg-[#1C3F94] text-white' : ''}
					>
						<CheckCircle className="w-4 h-4 mr-2" />
						Completed
					</Button>
				</div>

				{/* Contracts List */}
				{filteredContracts.length === 0 ? (
					<Card className="shadow-xl border-0">
						<CardContent className="p-12 text-center">
							<div className="relative inline-block mb-6">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl"></div>
								<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-6 sm:p-8 rounded-2xl">
									<FileText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
								</div>
							</div>
							<h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
								{activeTab === 'current' 
									? t('workshop.contracts.no_current_contracts') || 'No Current Contracts'
									: t('workshop.contracts.no_completed_contracts') || 'No Completed Contracts'
								}
							</h3>
							<p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
								{activeTab === 'current'
									? t('workshop.contracts.no_current_contracts_desc') || 'You don\'t have any active contracts at the moment.'
									: t('workshop.contracts.no_completed_contracts_desc') || 'You don\'t have any completed contracts yet.'
								}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4 sm:space-y-6">
						{filteredContracts.map((offer) => {
							const offerId = offer._id || offer.id
							const request = offer.requestId || offer.request
							const customer = request?.customerId || request?.customer
							const vehicle = request?.vehicleId || request?.vehicle

							// Skip if essential data is missing
							if (!offer || !request) {
								return null
							}

							return (
								<Card
									key={offerId}
									className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white"
								>
									{/* Top Accent Bar */}
									<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1C3F94] via-[#34C759] to-[#1C3F94]"></div>

									<CardHeader className="relative pb-3 pt-4 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-white">
										<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 sm:gap-3 mb-2">
													<div className="p-2 rounded-lg flex-shrink-0 shadow-md" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														<CheckCircle className="w-4 h-4" />
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-lg sm:text-xl font-bold text-gray-900 truncate mb-1">
															{vehicle?.make && vehicle?.model 
																? `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`.trim()
																: 'Vehicle Information'
															}
														</CardTitle>
														<CardDescription className="flex items-center gap-1.5 text-xs text-gray-600">
															<Calendar className="w-3.5 h-3.5 flex-shrink-0" />
															<span className="truncate">
																{t('workshop.contracts.accepted_on') || 'Accepted on'} {formatDate(new Date(offer.createdAt || offer.offerId?.createdAt))}
															</span>
														</CardDescription>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-3">
												{activeTab === 'current' ? (
													<Badge className="bg-green-100 text-green-800 border-green-200 border font-semibold">
														Active Contract
													</Badge>
												) : (
													<Badge className="bg-gray-100 text-gray-800 border-gray-200 border font-semibold">
														Completed
													</Badge>
												)}
											</div>
										</div>
									</CardHeader>

									<CardContent className="pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
											{/* Offer Details */}
											<div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
												<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
													<div className="p-1 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														<DollarSign className="w-3.5 h-3.5" />
													</div>
													Offer Details
												</h4>
												<div className="space-y-1.5 pl-7">
													<div className="flex items-center justify-between">
														<span className="text-xs text-gray-600">Price:</span>
														<span className="text-sm font-bold text-gray-900">{formatPrice(offer.price)}</span>
													</div>
													{offer.estimatedDuration && (
														<div className="flex items-center justify-between">
															<span className="text-xs text-gray-600">Estimated Duration:</span>
															<span className="text-sm font-medium text-gray-700">{offer.estimatedDuration} min</span>
														</div>
													)}
													{offer.warranty && (
														<div className="flex items-center justify-between">
															<span className="text-xs text-gray-600">Warranty:</span>
															<span className="text-sm font-medium text-gray-700">{offer.warranty}</span>
														</div>
													)}
												</div>
											</div>

											{/* Vehicle Info */}
											{vehicle && vehicle.make && (
												<div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
													<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
														<div className="p-1 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
															<Car className="w-3.5 h-3.5" />
														</div>
														Vehicle Information
													</h4>
													<div className="space-y-1.5 pl-7">
														<div className="text-sm font-bold text-gray-900">
															{vehicle.make} {vehicle.model}
														</div>
														<div className="text-xs text-gray-600">
															<span className="font-medium">Year:</span> {vehicle.year}
														</div>
														{request?.description && (
															<div className="pt-2 border-t border-gray-200">
																<p className="text-xs text-gray-600 italic">{request.description}</p>
															</div>
														)}
													</div>
												</div>
											)}

											{/* Customer Info */}
											{customer && (
												<div className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
													<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
														{customer.image ? (
															<img 
																src={customer.image.startsWith('/uploads/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${customer.image}` : customer.image} 
																alt={customer.name || 'Customer'} 
																className="w-6 h-6 rounded-full object-cover border-2 border-amber-200"
																onError={(e) => {
																	e.target.style.display = 'none'
																	e.target.nextElementSibling.style.display = 'flex'
																}}
															/>
														) : null}
														<div className={`p-1 rounded-lg bg-amber-100 ${customer.image ? 'hidden' : ''}`}>
															<User className="w-3.5 h-3.5 text-amber-600" />
														</div>
														Customer Information
													</h4>
													<div className="space-y-1.5 pl-7">
														<div className="flex items-center gap-2">
															{customer.image ? (
																<img 
																	src={customer.image.startsWith('/uploads/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${customer.image}` : customer.image} 
																	alt={customer.name || 'Customer'} 
																	className="w-8 h-8 rounded-full object-cover border-2 border-amber-200 flex-shrink-0"
																	onError={(e) => {
																		e.target.style.display = 'none'
																		e.target.nextElementSibling.style.display = 'flex'
																	}}
																/>
															) : null}
															<div className={`w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 ${customer.image ? 'hidden' : ''}`}>
																<User className="w-4 h-4 text-white" />
															</div>
															<div className="text-sm font-bold text-gray-900">
																{customer.name || 'N/A'}
															</div>
														</div>
														{customer.email && (
															<div className="flex items-center gap-1.5 text-xs text-gray-600">
																<Mail className="w-3.5 h-3.5" />
																<span>{customer.email}</span>
															</div>
														)}
														{customer.phone && (
															<div className="flex items-center gap-1.5 text-xs text-gray-600">
																<Phone className="w-3.5 h-3.5" />
																<span>{customer.phone}</span>
															</div>
														)}
													</div>
												</div>
											)}
										</div>

										{/* Note */}
										{(offer.note || offer.offerId?.note) && (
											<div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
												<div className="flex items-start gap-2">
													<FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
													<div>
														<p className="text-xs font-medium text-gray-700 mb-1">
															{t('workshop.contracts.note') || 'Note'}
														</p>
														<p className="text-xs text-gray-600">{offer.note || offer.offerId?.note}</p>
													</div>
												</div>
											</div>
										)}

										{/* Actions */}
										{activeTab === 'current' && (
											<div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
												<Button
													onClick={() => handleCancelClick(offerId)}
													disabled={cancellingId === offerId}
													variant="destructive"
													size="sm"
													className="font-medium"
												>
													{cancellingId === offerId ? (
														<>
															<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
															Cancelling...
														</>
													) : (
														<>
															<X className="w-4 h-4 mr-2" />
															Cancel Contract
														</>
													)}
												</Button>
											</div>
										)}
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
