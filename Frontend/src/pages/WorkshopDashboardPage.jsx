import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'
import { formatPrice, formatDate } from '../utils/cn'
import { useTranslation } from 'react-i18next'
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
	TrendingUp,
	Users,
	DollarSign,
	Send,
	MapPin,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { requestsAPI, workshopAPI } from '../services/api'

export default function WorkshopDashboardPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [requests, setRequests] = useState([])
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeOffers: 0,
		completedJobs: 0,
		totalRevenue: 0,
	})
	const [loading, setLoading] = useState(true)

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

	const fetchData = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			// Get workshop ID from user
			const workshopId = user.id || user._id
			
			// Fetch available requests (simplified - you may need to adjust based on your API)
			const requestsResponse = await requestsAPI.getAvailable({
				workshopId,
				latitude: user.latitude || 59.3293,
				longitude: user.longitude || 18.0686,
				radius: 50
			})
			
			if (requestsResponse.data) {
				setRequests(requestsResponse.data)
			}

			// Fetch stats
			try {
				const statsResponse = await workshopAPI.getStats()
				if (statsResponse.data) {
					setStats({
						totalRequests: statsResponse.data.totalRequests || 0,
						activeOffers: statsResponse.data.activeOffers || 0,
						completedJobs: statsResponse.data.completedJobs || 0,
						totalRevenue: statsResponse.data.totalRevenue || 0,
					})
				}
			} catch (statsError) {
				console.error('Stats fetch error:', statsError)
				// Continue without stats
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('errors.fetch_failed'))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchData()
		}
	}, [user])

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
						<Car className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading')}</p>
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			<Navbar />
			<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
								{t('workshop.dashboard.title')}
							</h1>
							<p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">{t('workshop.dashboard.subtitle')}</p>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
						<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
							<CardTitle className="text-xs sm:text-sm font-semibold text-blue-900">{t('workshop.dashboard.stats.total_requests')}</CardTitle>
							<div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
								<Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
						</CardHeader>
						<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
							<div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">{stats.totalRequests}</div>
							<p className="text-xs text-blue-700 font-medium">{t('workshop.dashboard.stats.total_requests_desc')}</p>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
						<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200 rounded-full blur-3xl opacity-50"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
							<CardTitle className="text-xs sm:text-sm font-semibold text-green-900">{t('workshop.dashboard.stats.active_offers')}</CardTitle>
							<div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
								<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
						</CardHeader>
						<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
							<div className="text-2xl sm:text-3xl font-bold text-green-900 mb-1">{stats.activeOffers}</div>
							<p className="text-xs text-green-700 font-medium">{t('workshop.dashboard.stats.active_offers_desc')}</p>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
						<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-purple-200 rounded-full blur-3xl opacity-50"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
							<CardTitle className="text-xs sm:text-sm font-semibold text-purple-900">{t('workshop.dashboard.stats.completed_jobs')}</CardTitle>
							<div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg">
								<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
						</CardHeader>
						<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
							<div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">{stats.completedJobs}</div>
							<p className="text-xs text-purple-700 font-medium">{t('workshop.dashboard.stats.completed_jobs_desc')}</p>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100">
						<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-amber-200 rounded-full blur-3xl opacity-50"></div>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
							<CardTitle className="text-xs sm:text-sm font-semibold text-amber-900">{t('workshop.dashboard.stats.total_revenue')}</CardTitle>
							<div className="p-1.5 sm:p-2 bg-amber-500 rounded-lg">
								<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
						</CardHeader>
						<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
							<div className="text-2xl sm:text-3xl font-bold text-amber-900 mb-1">{formatPrice(stats.totalRevenue)}</div>
							<p className="text-xs text-amber-700 font-medium">{t('workshop.dashboard.stats.total_revenue_desc')}</p>
						</CardContent>
					</Card>
				</div>

				{/* Requests */}
				<Card className="shadow-xl border-0 overflow-hidden">
					<CardHeader className="bg-gradient-to-r relative overflow-hidden px-4 sm:px-6 py-5 sm:py-6" style={{ background: 'linear-gradient(135deg, #1C3F94 0%, #1C3F94 100%)' }}>
						<div className="absolute inset-0 opacity-10">
							<div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ backgroundColor: '#34C759', filter: 'blur(60px)' }}></div>
							<div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white" style={{ filter: 'blur(40px)' }}></div>
						</div>
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 relative z-10">
							<div className="flex items-center gap-3 sm:gap-4">
								<div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
									<Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
								</div>
								<div>
									<CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
										{t('workshop.dashboard.requests.title')}
									</CardTitle>
									<CardDescription className="text-white/90 text-sm sm:text-base">
										{t('workshop.dashboard.requests.subtitle')}
									</CardDescription>
								</div>
							</div>
							<Link to="/workshop/requests" className="w-full sm:w-auto">
								<Button 
									size="sm" 
									className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm font-semibold bg-white hover:bg-white/90 text-[#1C3F94] border-0"
								>
									<Eye className="w-4 h-4 mr-2" />
									{t('workshop.dashboard.requests.view_all') || 'View All Requests'}
								</Button>
							</Link>
						</div>
					</CardHeader>
					<CardContent className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
						{requests.length === 0 ? (
							<div className="text-center py-12 sm:py-16 md:py-20">
								<div className="relative inline-block mb-6">
									<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl"></div>
									<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-6 sm:p-8 rounded-2xl">
										<Car className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
									</div>
								</div>
								<h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
									{t('workshop.dashboard.requests.no_requests.title')}
								</h3>
								<p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
									{t('workshop.dashboard.requests.no_requests.description')}
								</p>
							</div>
						) : (
							<div className="space-y-4 sm:space-y-6">
								{requests.slice(0, 2).map((request) => {
									const requestId = request._id || request.id
									const vehicle = request.vehicleId || request.vehicle
									const customer = request.customerId || request.customer
									const offers = request.offers || []

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
																		<Users className="w-4 h-4 flex-shrink-0" style={{ color: '#1C3F94' }} />
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
																	{offers.length > 0 ? (
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
								
								{/* Show "View All" link if more than 2 requests */}
								{requests.length > 2 && (
									<div className="text-center pt-4">
										<Link to="/workshop/requests">
											<Button 
												variant="outline" 
												className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold border-2 hover:bg-gray-50"
											>
												<Eye className="w-4 h-4 mr-2" />
												{t('workshop.dashboard.requests.view_all')} ({requests.length} {t('workshop.dashboard.requests.total') || 'total'})
											</Button>
										</Link>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
