import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { requestsAPI } from '../services/api'
import {
	Car,
	MapPin,
	Clock,
	Eye,
	Calendar,
	AlertCircle,
	User,
	Send,
	CheckCircle2,
	Search,
	CheckCircle,
	XCircle,
	Users,
	MessageSquare,
} from 'lucide-react'

export default function WorkshopRequestsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	// Redirect if not authenticated or not workshop
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

	const fetchRequests = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			// Backend requires latitude and longitude, use defaults if not available
			const response = await requestsAPI.getAvailable({
				latitude: user.latitude || 59.3293, // Stockholm default
				longitude: user.longitude || 18.0686, // Stockholm default
				radius: 50, // 50km radius
			})
			
			if (response.data) {
				setRequests(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch requests:', error)
			console.error('Error details:', error.response?.data)
			toast.error(error.response?.data?.message || t('errors.fetch_failed'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchRequests()
		}
	}, [user])

	if (authLoading || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
				<div className="text-center">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-[#1C3F94]/20 border-t-[#1C3F94] rounded-full animate-spin mx-auto mb-4"></div>
						<Car className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#1C3F94]" />
					</div>
					<p className="text-gray-600 font-medium">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'WORKSHOP') {
		return null
	}

	const getStatusBadge = (status) => {
		const statusMap = {
			NEW: {
				label: t('workshop.dashboard.status.new'),
				className: 'bg-blue-100 text-blue-800 border-blue-200 border',
			},
			IN_BIDDING: {
				label: t('workshop.dashboard.status.in_bidding'),
				className: 'bg-yellow-100 text-yellow-800 border-yellow-200 border',
			},
			BIDDING_CLOSED: {
				label: t('workshop.dashboard.status.bidding_closed'),
				className: 'bg-green-100 text-green-800 border-green-200 border',
			},
			BOOKED: {
				label: t('workshop.dashboard.status.booked'),
				className: 'bg-purple-100 text-purple-800 border-purple-200 border',
			},
			COMPLETED: {
				label: t('workshop.dashboard.status.completed'),
				className: 'bg-emerald-100 text-emerald-800 border-emerald-200 border',
			},
			CANCELLED: {
				label: t('workshop.dashboard.status.cancelled'),
				className: 'bg-red-100 text-red-800 border-red-200 border',
			},
		}

		const statusInfo = statusMap[status] || {
			label: status,
			className: 'bg-gray-100 text-gray-800 border-gray-200 border',
		}

		return (
			<div className={`${statusInfo.className} inline-flex items-center rounded-full border font-semibold px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm`}>
				{statusInfo.label}
			</div>
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

	// Filter requests based on search query
	const filteredRequests = requests.filter((request) => {
		if (!searchQuery.trim()) return true

		const query = searchQuery.toLowerCase()
		const vehicle = request.vehicleId || request.vehicle
		const customer = request.customerId || request.customer

		return (
			(vehicle?.make && vehicle.make.toLowerCase().includes(query)) ||
			(vehicle?.model && vehicle.model.toLowerCase().includes(query)) ||
			(vehicle?.year && vehicle.year.toString().includes(query)) ||
			(request.city && request.city.toLowerCase().includes(query)) ||
			(request.address && request.address.toLowerCase().includes(query)) ||
			(customer?.name && customer.name.toLowerCase().includes(query)) ||
			(request.description && request.description.toLowerCase().includes(query))
		)
	})

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
			<Navbar />
			
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16">
				{/* Compact Header */}
				<div className="mb-8 sm:mb-10">
					<div className="mb-6">
						<div className="flex items-center gap-3">
							<div className="p-2.5 bg-[#1C3F94] rounded-lg shadow-md">
								<Car className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
									{t('workshop.requests.title') || 'Available Requests'}
								</h1>
								<p className="text-sm sm:text-base text-gray-600 mt-1">
									{t('workshop.requests.subtitle') || 'Browse and submit offers for customer requests'}
								</p>
							</div>
						</div>
					</div>

					{/* Search Bar */}
					<div className="relative">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search for jobs"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-12 pr-4 py-3 text-base border-2 border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-0 rounded-lg shadow-sm w-full"
						/>
					</div>
				</div>
				{requests.length === 0 ? (
					<Card className="border-0 shadow-2xl overflow-hidden">
						<CardContent className="text-center py-20 sm:py-24 px-6 bg-gradient-to-br from-white to-gray-50">
							<div className="relative inline-block mb-8">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl animate-pulse"></div>
								<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-10 sm:p-12 rounded-3xl border-2 border-gray-200">
									<Car className="w-24 h-24 sm:w-28 sm:h-28 mx-auto" style={{ color: '#1C3F94' }} />
								</div>
							</div>
							<h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
								{t('workshop.requests.no_requests.title') || 'No Available Requests'}
							</h3>
							<p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
								{t('workshop.requests.no_requests.description') || 'There are no requests available at the moment. Check back later for new opportunities.'}
							</p>
						</CardContent>
					</Card>
				) : (
					<>
						{filteredRequests.length === 0 && searchQuery ? (
							<Card className="border-0 shadow-lg">
								<CardContent className="text-center py-12 px-6">
									<Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
									<h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
									<p className="text-gray-600">
										No requests match your search "{searchQuery}". Try different keywords.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="space-y-6 sm:space-y-8">
								{filteredRequests.map((request) => {
							const requestId = request._id || request.id
							const vehicle = request.vehicleId || request.vehicle
							const customer = request.customerId || request.customer
							const offers = request.offers || []
							const hasOffer = offers.length > 0
							const offer = hasOffer ? offers[0] : null

							return (
								<div
									key={requestId}
									className="relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
								>
									<div className="p-5 sm:p-6 md:p-7">
										{/* Header */}
										<div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 sm:mb-6">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 sm:gap-4 mb-3">
													<div className="p-2 sm:p-2.5 rounded-xl flex-shrink-0 shadow-md" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														{getStatusIcon(request.status)}
													</div>
													<div className="min-w-0 flex-1">
														<h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 truncate">
															{vehicle?.make} {vehicle?.model} {vehicle?.year}
														</h3>
														<div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
															<div className="flex items-center gap-1.5">
																{customer?.image ? (
																	<img 
																		src={customer.image.startsWith('/uploads/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${customer.image}` : customer.image} 
																		alt={customer?.name || 'Customer'} 
																		className="w-5 h-5 rounded-full object-cover border border-gray-200 flex-shrink-0"
																		onError={(e) => {
																			e.target.style.display = 'none'
																			e.target.nextElementSibling.style.display = 'flex'
																		}}
																	/>
																) : null}
																<Users className={`w-4 h-4 flex-shrink-0 ${customer?.image ? 'hidden' : ''}`} style={{ color: '#1C3F94' }} />
																<span className="truncate font-medium">{customer?.name || 'Customer'}</span>
															</div>
															<span className="text-gray-400">•</span>
															<div className="flex items-center gap-1.5">
																<Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#34C759' }} />
																<span>{formatDate(new Date(request.createdAt))}</span>
															</div>
															{request.expiresAt && (
																<>
																	<span className="text-gray-400">•</span>
																	<div className="flex items-center gap-1.5">
																		<AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B6B' }} />
																		<span>{t('workshop.dashboard.requests.expiry')}: {formatDate(new Date(request.expiresAt))}</span>
																	</div>
																</>
															)}
														</div>
													</div>
												</div>
											</div>
											<div className="flex-shrink-0">
												{getStatusBadge(request.status)}
											</div>
										</div>

										{/* Content Grid */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pt-5 border-t border-gray-200">
											{/* Vehicle Info */}
											<div className="space-y-3">
												<div className="flex items-center gap-2 mb-3">
													<div className="p-1.5 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
														<Car className="w-4 h-4" />
													</div>
													<h4 className="font-bold text-sm sm:text-base text-gray-900">
														{t('workshop.dashboard.requests.vehicle_info')}
													</h4>
												</div>
												<div className="pl-7 space-y-2">
													<p className="text-sm sm:text-base font-semibold text-gray-900">
														{vehicle?.make} {vehicle?.model}
													</p>
													<p className="text-xs sm:text-sm text-gray-600">
														{t('workshop.dashboard.requests.year')}: <span className="font-medium">{vehicle?.year}</span>
													</p>
													{request.description && (
														<div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
															<p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
																{request.description}
															</p>
														</div>
													)}
												</div>
											</div>

											{/* Location */}
											<div className="space-y-3">
												<div className="flex items-center gap-2 mb-3">
													<div className="p-1.5 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
														<MapPin className="w-4 h-4" />
													</div>
													<h4 className="font-bold text-sm sm:text-base text-gray-900">
														{t('workshop.dashboard.requests.location')}
													</h4>
												</div>
												<div className="pl-7 space-y-2">
													{request.address && (
														<p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
															{request.address}
														</p>
													)}
													{request.city && (
														<p className="text-xs sm:text-sm text-gray-600">
															{request.city}
														</p>
													)}
													{!request.address && !request.city && (
														<p className="text-xs sm:text-sm text-gray-500 italic">
															{t('common.no_data') || 'N/A'}
														</p>
													)}
												</div>
											</div>

											{/* Actions */}
											<div className="space-y-3">
												<div className="flex items-center gap-2 mb-3">
													<div className="p-1.5 rounded-lg bg-amber-100">
														<MessageSquare className="w-4 h-4" style={{ color: '#1C3F94' }} />
													</div>
													<h4 className="font-bold text-sm sm:text-base text-gray-900">
														{t('workshop.dashboard.requests.actions')}
													</h4>
												</div>
												<div className="pl-7 space-y-3">
													{request.status === 'IN_BIDDING' && offers.length === 0 && (
														<Link to={`/workshop/requests/${requestId}/offer`} className="block">
															<Button 
																size="sm" 
																className="w-full shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm font-semibold"
																style={{ 
																	background: 'linear-gradient(135deg, #1C3F94 0%, #1C3F94 100%)',
																	color: '#FFFFFF'
																}}
															>
																<MessageSquare className="w-4 h-4 mr-2" />
																{t('workshop.dashboard.requests.apply_for_jobs')}
															</Button>
														</Link>
													)}
													{offers.length > 0 && (
														<div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
															<p className="text-xs font-bold text-green-900 mb-2 uppercase tracking-wide">
																{t('workshop.dashboard.requests.your_offer')}
															</p>
															<p className="text-xl sm:text-2xl font-extrabold mb-3" style={{ color: '#34C759' }}>
																{formatPrice(offers[0].price)}
															</p>
															<Badge
																className={`text-xs font-semibold px-3 py-1 ${
																	offers[0].status === 'ACCEPTED'
																		? 'bg-green-600 text-white border-0'
																		: 'bg-yellow-100 text-yellow-800 border-yellow-300'
																}`}
															>
																{offers[0].status === 'ACCEPTED' ? t('workshop.dashboard.requests.offer_accepted') : t('workshop.dashboard.requests.offer_pending')}
															</Badge>
														</div>
													)}
													{!(request.status === 'IN_BIDDING' && offers.length === 0) && (
														<Link to={`/workshop/requests/${requestId}/offer`} className="block">
															{hasOffer && offer ? (
																<Button 
																	size="sm" 
																	className="w-full text-xs sm:text-sm font-semibold"
																	style={{ backgroundColor: '#34C759', color: '#FFFFFF', borderColor: '#34C759' }}
																>
																	<Send className="w-4 h-4 mr-2" />
																	{t('workshop.offer.edit_offer')}
																</Button>
															) : (
																<Button 
																	size="sm" 
																	className="w-full text-xs sm:text-sm font-semibold"
																	style={{ backgroundColor: '#1C3F94', color: '#FFFFFF', borderColor: '#1C3F94' }}
																>
																	<Send className="w-4 h-4 mr-2" />
																	{t('workshop.dashboard.requests.apply_for_jobs')}
																</Button>
															)}
														</Link>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>
							)
						})}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
