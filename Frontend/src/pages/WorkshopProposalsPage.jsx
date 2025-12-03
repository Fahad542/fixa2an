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
	Calendar,
	CheckCircle,
	XCircle,
	Clock,
	FileText,
	Eye,
	Edit,
	DollarSign,
	AlertCircle,
	Send,
	User,
	Mail,
	Phone,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { offersAPI } from '../services/api'

export default function WorkshopProposalsPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const { t } = useTranslation()
	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('all') // all, sent, accepted, declined, expired

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

	const fetchOffers = async () => {
		if (!user || user.role !== 'WORKSHOP') return

		try {
			const response = await offersAPI.getByWorkshop()
			if (response.data) {
				setOffers(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch offers:', error)
			toast.error(t('workshop.proposals.fetch_error') || 'Failed to fetch proposals')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
			fetchOffers()
		}
	}, [user])

	const getStatusBadge = (status) => {
		const statusMap = {
			SENT: {
				label: t('workshop.proposals.status.sent') || 'Sent',
				className: 'bg-blue-100 text-blue-800 border-blue-200',
			},
			ACCEPTED: {
				label: t('workshop.proposals.status.accepted') || 'Accepted',
				className: 'bg-green-100 text-green-800 border-green-200',
			},
			DECLINED: {
				label: t('workshop.proposals.status.declined') || 'Declined',
				className: 'bg-red-100 text-red-800 border-red-200',
			},
			EXPIRED: {
				label: t('workshop.proposals.status.expired') || 'Expired',
				className: 'bg-gray-100 text-gray-800 border-gray-200',
			},
		}

		const statusInfo = statusMap[status] || statusMap.SENT
		return (
			<Badge className={`${statusInfo.className} border font-semibold`}>
				{statusInfo.label}
			</Badge>
		)
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'SENT':
				return <Send className="w-4 h-4" />
			case 'ACCEPTED':
				return <CheckCircle className="w-4 h-4" />
			case 'DECLINED':
				return <XCircle className="w-4 h-4" />
			case 'EXPIRED':
				return <AlertCircle className="w-4 h-4" />
			default:
				return <Clock className="w-4 h-4" />
		}
	}

	const filteredOffers = offers.filter((offer) => {
		if (activeTab === 'all') return true
		return offer.status === activeTab.toUpperCase()
	})

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
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
			<Navbar />
			<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<div>
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
							{t('workshop.proposals.title') || 'Proposals'}
						</h1>
						<p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
							{t('workshop.proposals.subtitle') || 'View and manage your submitted proposals'}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					<Button
						variant={activeTab === 'all' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('all')}
						className={activeTab === 'all' ? 'bg-[#1C3F94] text-white' : ''}
					>
						{t('workshop.proposals.tabs.all') || 'All'}
					</Button>
					<Button
						variant={activeTab === 'sent' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('sent')}
						className={activeTab === 'sent' ? 'bg-[#1C3F94] text-white' : ''}
					>
						{t('workshop.proposals.tabs.sent') || 'Sent'}
					</Button>
					<Button
						variant={activeTab === 'accepted' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('accepted')}
						className={activeTab === 'accepted' ? 'bg-[#1C3F94] text-white' : ''}
					>
						{t('workshop.proposals.tabs.accepted') || 'Accepted'}
					</Button>
					<Button
						variant={activeTab === 'declined' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('declined')}
						className={activeTab === 'declined' ? 'bg-[#1C3F94] text-white' : ''}
					>
						{t('workshop.proposals.tabs.declined') || 'Declined'}
					</Button>
					<Button
						variant={activeTab === 'expired' ? 'default' : 'outline'}
						size="sm"
						onClick={() => setActiveTab('expired')}
						className={activeTab === 'expired' ? 'bg-[#1C3F94] text-white' : ''}
					>
						{t('workshop.proposals.tabs.expired') || 'Expired'}
					</Button>
				</div>

				{/* Offers List */}
				{filteredOffers.length === 0 ? (
					<Card className="shadow-xl border-0">
						<CardContent className="p-12 text-center">
							<div className="relative inline-block mb-6">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/20 to-[#34C759]/20 rounded-full blur-3xl"></div>
								<div className="relative bg-gradient-to-br from-[#1C3F94]/10 to-[#34C759]/10 p-6 sm:p-8 rounded-2xl">
									<FileText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" style={{ color: '#1C3F94' }} />
								</div>
							</div>
							<h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900">
								{t('workshop.proposals.no_proposals.title') || 'No Proposals'}
							</h3>
							<p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
								{t('workshop.proposals.no_proposals.description') || 'You haven\'t submitted any proposals yet.'}
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4 sm:space-y-6">
						{filteredOffers.map((offer) => {
							const offerId = offer._id || offer.id
							const request = offer.requestId || offer.request
							const vehicle = request?.vehicleId || request?.vehicle
							const customer = request?.customerId || request?.customer

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
														{getStatusIcon(offer.status)}
													</div>
													<div className="min-w-0 flex-1">
														<CardTitle className="text-lg sm:text-xl font-bold text-gray-900 truncate mb-1">
															{vehicle?.make} {vehicle?.model} {vehicle?.year}
														</CardTitle>
														<CardDescription className="flex items-center gap-1.5 text-xs text-gray-600">
															<Calendar className="w-3.5 h-3.5 flex-shrink-0" />
															<span className="truncate">
																{t('workshop.proposals.submitted') || 'Submitted'}: {formatDate(new Date(offer.createdAt))}
															</span>
														</CardDescription>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-3">
												{getStatusBadge(offer.status)}
												{offer.status === 'SENT' && (
													<Link to={`/workshop/requests/${request?._id || request?.id}/offer`}>
														<Button
															size="sm"
															variant="outline"
															className="flex items-center gap-2"
														>
															<Edit className="w-4 h-4" />
															{t('workshop.proposals.edit') || 'Edit'}
														</Button>
													</Link>
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
													{t('workshop.proposals.offer_details') || 'Offer Details'}
												</h4>
												<div className="space-y-1.5 pl-7">
													<div className="flex items-center justify-between">
														<span className="text-xs text-gray-600">{t('workshop.proposals.price') || 'Price'}:</span>
														<span className="text-sm font-bold text-gray-900">{formatPrice(offer.price)}</span>
													</div>
													{offer.estimatedDuration && (
														<div className="flex items-center justify-between">
															<span className="text-xs text-gray-600">
																{t('workshop.proposals.estimated_duration') || 'Estimated Duration'}:</span>
															<span className="text-sm font-medium text-gray-700">{offer.estimatedDuration} min</span>
														</div>
													)}
													{offer.warranty && (
														<div className="flex items-center justify-between">
															<span className="text-xs text-gray-600">{t('workshop.proposals.warranty') || 'Warranty'}:</span>
															<span className="text-sm font-medium text-gray-700">{offer.warranty}</span>
														</div>
													)}
												</div>
											</div>

											{/* Vehicle Info */}
											{vehicle && (
												<div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
													<h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2.5 flex items-center gap-2">
														<div className="p-1 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
															<Car className="w-3.5 h-3.5" />
														</div>
														{t('workshop.proposals.vehicle_info') || 'Vehicle Information'}
													</h4>
													<div className="space-y-1.5 pl-7">
														<div className="text-sm font-bold text-gray-900">
															{vehicle.make} {vehicle.model}
														</div>
														<div className="text-xs text-gray-600">
															<span className="font-medium">{t('workshop.proposals.year') || 'Year'}:</span> {vehicle.year}
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
										{offer.note && (
											<div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
												<div className="flex items-start gap-2">
													<FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
													<div>
														<p className="text-xs font-medium text-gray-700 mb-1">
															{t('workshop.proposals.note') || 'Note'}
														</p>
														<p className="text-xs text-gray-600">{offer.note}</p>
													</div>
												</div>
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

