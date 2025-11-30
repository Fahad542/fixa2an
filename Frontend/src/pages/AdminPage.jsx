import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import toast from 'react-hot-toast'
import { formatPrice, formatDate, formatDateTime } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/api'
import {
	Users,
	Building2,
	FileText,
	DollarSign,
	TrendingUp,
	CheckCircle,
	XCircle,
	Clock,
	AlertTriangle,
	Search,
	Ban,
	Unlock,
	Shield,
	Calendar,
	Package,
	CreditCard,
	RefreshCw,
	LogOut,
	ChevronDown,
	Menu,
	X,
} from 'lucide-react'

export default function AdminPage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, logout } = useAuth()
	const { t } = useTranslation()
	const [activeTab, setActiveTab] = useState('dashboard')
	const [loading, setLoading] = useState(true)
	const [listLoading, setListLoading] = useState(false)
	const [stats, setStats] = useState({
		totalCustomers: 0,
		totalWorkshops: 0,
		pendingWorkshops: 0,
		totalRequests: 0,
		totalBookings: 0,
		totalRevenue: 0,
		monthlyRevenue: 0,
	})
	
	// Data states
	const [customers, setCustomers] = useState([])
	const [workshops, setWorkshops] = useState([])
	const [requests, setRequests] = useState([])
	const [offers, setOffers] = useState([])
	const [bookings, setBookings] = useState([])
	const [payouts, setPayouts] = useState([])
	
	// Filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
	
	// Payout generation
	const [payoutMonth, setPayoutMonth] = useState(new Date().getMonth() + 1)
	const [payoutYear, setPayoutYear] = useState(new Date().getFullYear())
	const [generating, setGenerating] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const mobileMenuRef = useRef(null)

	// Redirect if not authenticated or not admin
	useEffect(() => {
		if (!authLoading) {
			if (!user) {
				navigate('/auth/signin', { replace: true })
				return
			}
			if (user.role !== 'ADMIN') {
				if (user.role === 'WORKSHOP') {
					navigate('/workshop/requests', { replace: true })
				} else {
					navigate('/my-cases', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
				setMobileMenuOpen(false)
			}
		}

		if (mobileMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [mobileMenuOpen])

	useEffect(() => {
		if (user && user.role === 'ADMIN') {
			fetchStats()
			if (activeTab === 'dashboard') {
				fetchPendingWorkshops()
			}
		}
	}, [user, activeTab])

	// Update data when filters change
	useEffect(() => {
		if (user && user.role === 'ADMIN') {
			// For customers tab, add a small debounce to avoid too many API calls while typing
			if (activeTab === 'customers') {
				const timeoutId = setTimeout(() => {
					fetchTabData()
				}, 200)
				return () => clearTimeout(timeoutId)
			} else {
				// For other tabs, fetch immediately
				fetchTabData()
			}
		}
	}, [activeTab, searchQuery, statusFilter, pagination.page, user])

	const fetchStats = async () => {
		try {
			const response = await adminAPI.getStats()
			if (response.data) {
				setStats(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchPendingWorkshops = async () => {
		try {
			const response = await adminAPI.getPendingWorkshops()
			if (response.data) {
				setWorkshops(response.data)
			}
		} catch (error) {
			console.error('Failed to fetch pending workshops:', error)
		}
	}

	const fetchTabData = async () => {
		setListLoading(true)
		try {
			const params = {}
			if (searchQuery) params.search = searchQuery
			if (statusFilter !== 'all') {
				if (activeTab === 'workshops' && statusFilter === 'pending') {
					params.verified = 'false'
				} else {
					params.status = statusFilter
				}
			}
			params.page = pagination.page
			params.limit = pagination.limit

			let response
			switch (activeTab) {
				case 'customers':
					response = await adminAPI.getUsers(params)
					if (response.data) {
						setCustomers(response.data.users || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'workshops':
					response = await adminAPI.getWorkshops(params)
					if (response.data) {
						setWorkshops(response.data.workshops || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'requests':
					response = await adminAPI.getRequests(params)
					if (response.data) {
						setRequests(response.data.requests || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'offers':
					response = await adminAPI.getOffers(params)
					if (response.data) {
						setOffers(response.data.offers || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'bookings':
					response = await adminAPI.getBookings(params)
					if (response.data) {
						setBookings(response.data.bookings || [])
						setPagination((p) => ({ ...p, total: response.data.total || 0 }))
					}
					break
				case 'payouts':
					if (payoutMonth && payoutYear) {
						response = await adminAPI.getPayouts({ month: payoutMonth, year: payoutYear })
						if (response.data) {
							setPayouts(response.data.reports || [])
							setPagination((p) => ({ ...p, total: response.data.reports?.length || 0 }))
						}
					}
					break
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('common.could_not_fetch'))
		} finally {
			setListLoading(false)
		}
	}

	const handleWorkshopAction = async (workshopId, action) => {
		try {
			let updateData = {}
			if (action === 'approve') updateData.isVerified = true
			if (action === 'reject') updateData.isVerified = false
			if (action === 'block') updateData.isActive = false
			if (action === 'unblock') updateData.isActive = true

			const response = await adminAPI.updateWorkshop({ id: workshopId, ...updateData })

			if (response.data) {
				const actionKey = action === 'approve' ? 'workshop_approved' : action === 'reject' ? 'workshop_rejected' : action === 'block' ? 'workshop_blocked' : 'workshop_unblocked'
				toast.success(t(`common.${actionKey}`))
				
				// Immediately remove from pending workshops list if approve/reject
				if (action === 'approve' || action === 'reject') {
					setWorkshops((prev) => prev.filter((w) => w.id !== workshopId))
				}
				
				// Update stats and tab data
				fetchStats()
				if (activeTab !== 'dashboard') {
					fetchTabData()
				} else {
					// Refresh pending workshops for dashboard
					fetchPendingWorkshops()
				}
			}
		} catch (error) {
			toast.error(t('common.failed_update_workshop'))
		}
	}

	const handleGeneratePayouts = async () => {
		setGenerating(true)
		try {
			const response = await adminAPI.generatePayouts({ month: payoutMonth, year: payoutYear })

			if (response.data) {
				const count = response.data.count || 0
				toast.success(
					count === 1 
						? t('common.generated_reports_one')
						: t('common.generated_reports_other').replace('{count}', count.toString())
				)
				fetchTabData()
			}
		} catch (error) {
			toast.error(t('common.failed_generate_reports'))
		} finally {
			setGenerating(false)
		}
	}

	const handleMarkPayoutPaid = async (payoutId) => {
		try {
			const response = await adminAPI.markPayoutPaid(payoutId)

			if (response.data) {
				toast.success(t('common.payout_marked_paid'))
				fetchTabData()
			}
		} catch (error) {
			toast.error(t('common.failed_mark_paid'))
		}
	}

	const handleLogout = () => {
		logout()
		navigate('/')
	}

	const exportToCSV = (data, filename) => {
		if (data.length === 0) return

		const headers = Object.keys(data[0])
		const csv = [
			headers.join(','),
			...data.map((row) => headers.map((header) => JSON.stringify(row[header] || '')).join(',')),
		].join('\n')

		const blob = new Blob([csv], { type: 'text/csv' })
		const url = window.URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = filename
		a.click()
		window.URL.revokeObjectURL(url)
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#1C3F94' }} />
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'ADMIN') {
		return null
	}

	const tabs = ['dashboard', 'customers', 'workshops', 'requests', 'offers', 'bookings', 'payouts']

	return (
		<div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F8F9FA' }}>
			{/* Header with gradient */}
			<div className="relative overflow-hidden" style={{ backgroundColor: '#1C3F94' }}>
				<div className="absolute inset-0 opacity-10 overflow-hidden">
					<div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full" style={{ backgroundColor: '#34C759', filter: 'blur(100px)' }}></div>
					<div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 rounded-full" style={{ backgroundColor: '#FFFFFF', filter: 'blur(100px)' }}></div>
				</div>
				<div className="relative px-3 sm:px-4 md:px-6 py-6 sm:py-8">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div className="flex-1">
							<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-1 sm:mb-2 text-white">
								{t('admin.title')}
							</h1>
							<p className="text-white/90 text-sm sm:text-base md:text-lg">{t('admin.subtitle')}</p>
						</div>
					</div>
				</div>
			</div>

			<div className="px-3 sm:px-4 md:px-6 -mt-4 sm:-mt-6 overflow-x-hidden">
				{/* Mobile Hamburger Menu Button */}
				<div className="xl:hidden mb-4 mt-8 sm:mt-6 md:mt-8 lg:mt-8 flex items-center gap-3">
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="flex items-center justify-between flex-1 px-4 py-3 bg-white rounded-lg shadow-md border border-gray-200"
					>
						<div className="flex items-center gap-3">
							{mobileMenuOpen ? (
								<X className="w-5 h-5" style={{ color: '#1C3F94' }} />
							) : (
								<Menu className="w-5 h-5" style={{ color: '#1C3F94' }} />
							)}
							<span className="font-semibold text-sm sm:text-base" style={{ color: '#1C3F94' }}>
								{t(`admin.tabs.${activeTab}`)}
							</span>
						</div>
						<ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} style={{ color: '#1C3F94' }} />
					</button>
					<div className="[&_*]:text-gray-700 [&_button]:bg-gray-100 [&_button]:backdrop-blur-sm [&_button]:border-gray-200 [&_button:hover]:bg-gray-200">
						<LanguageSwitcher />
					</div>
				</div>

				{/* Mobile Menu Dropdown */}
				{mobileMenuOpen && (
					<div ref={mobileMenuRef} className="xl:hidden mb-4">
						<Card className="shadow-lg border-0">
							<div className="p-2 space-y-1">
								{tabs.map((tab) => (
									<button
										key={tab}
										onClick={() => {
											setActiveTab(tab)
											setSearchQuery('')
											setStatusFilter('all')
											setPagination({ ...pagination, page: 1 })
											setMobileMenuOpen(false)
										}}
										className={`w-full px-4 py-3 font-semibold text-sm transition-all rounded-lg text-left ${
											activeTab === tab
												? 'shadow-md'
												: 'hover:bg-gray-100'
										}`}
										style={
											activeTab === tab
												? {
														backgroundColor: '#1C3F94',
														color: '#FFFFFF',
												  }
												: {
														color: '#666666',
												  }
										}
									>
										{t(`admin.tabs.${tab}`)}
									</button>
								))}
								{/* Logout Button */}
								<div className="border-t border-gray-200 mt-2 pt-2">
									<button
										onClick={() => {
											handleLogout()
											setMobileMenuOpen(false)
										}}
										className="w-full px-4 py-3 font-semibold text-sm transition-all rounded-lg text-left hover:bg-red-50 text-red-600"
									>
										<div className="flex items-center gap-2">
											<LogOut className="w-4 h-4" />
											<span>{t('common.logout')}</span>
										</div>
									</button>
								</div>
							</div>
						</Card>
					</div>
				)}

				{/* Desktop Tabs */}
				<div className="hidden xl:flex items-center gap-4 mb-4 sm:mb-6 mt-4 sm:mt-8">
					<Card className="flex-1 shadow-lg border-0">
						<div className="flex space-x-1 overflow-x-auto p-2 sm:p-4 scrollbar-hide">
							{tabs.map((tab) => (
								<button
									key={tab}
									onClick={() => {
										setActiveTab(tab)
										setSearchQuery('')
										setStatusFilter('all')
										setPagination({ ...pagination, page: 1 })
									}}
									className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm transition-all rounded-lg whitespace-nowrap ${
										activeTab === tab
											? 'shadow-md'
											: 'hover:bg-gray-100'
									}`}
									style={
										activeTab === tab
											? {
													backgroundColor: '#1C3F94',
													color: '#FFFFFF',
											  }
											: {
													color: '#666666',
											  }
									}
								>
									{t(`admin.tabs.${tab}`)}
								</button>
							))}
						</div>
					</Card>
					<div className="flex items-center gap-3">
						<div className="[&_*]:text-gray-700 [&_button]:bg-white [&_button]:backdrop-blur-sm [&_button]:border-gray-200 [&_button:hover]:bg-gray-50 [&_button]:shadow-md">
							<LanguageSwitcher />
						</div>
						<button
							onClick={handleLogout}
							className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md"
						>
							<LogOut className="w-4 h-4" />
							<span>{t('common.logout')}</span>
						</button>
					</div>
				</div>

				{/* Dashboard Tab */}
				{activeTab === 'dashboard' && (
					<div className="space-y-4 sm:space-y-6 overflow-x-hidden">
						{/* Stats Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
							<Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group relative">
								<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#1C3F94', transform: 'translate(20%, -20%)' }}></div>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
									<CardTitle className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('admin.stats.customers')}</CardTitle>
									<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
										<Users className="h-4 w-4 sm:h-5 sm:w-5" />
									</div>
								</CardHeader>
								<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
									<div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1" style={{ color: '#1C3F94' }}>
										{stats.totalCustomers}
									</div>
									<p className="text-xs text-gray-500">{t('common.total_registered')}</p>
								</CardContent>
							</Card>

							<Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group relative">
								<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#1C3F94', transform: 'translate(20%, -20%)' }}></div>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
									<CardTitle className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('admin.stats.workshops')}</CardTitle>
									<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
										<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
									</div>
								</CardHeader>
								<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
									<div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1" style={{ color: '#1C3F94' }}>
										{stats.totalWorkshops}
									</div>
									<p className="text-xs text-gray-500">
										{stats.pendingWorkshops} {t('admin.stats.pending_workshops')}
									</p>
								</CardContent>
							</Card>

							<Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group relative">
								<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#34C759', transform: 'translate(20%, -20%)' }}></div>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
									<CardTitle className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('admin.stats.requests')}</CardTitle>
									<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
										<FileText className="h-4 w-4 sm:h-5 sm:w-5" />
									</div>
								</CardHeader>
								<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
									<div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1" style={{ color: '#34C759' }}>
										{stats.totalRequests}
									</div>
									<p className="text-xs text-gray-500">{t('common.active_requests')}</p>
								</CardContent>
							</Card>

							<Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group relative">
								<div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#34C759', transform: 'translate(20%, -20%)' }}></div>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 px-4 sm:px-6 pt-4 sm:pt-6">
									<CardTitle className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">{t('admin.stats.monthly_revenue')}</CardTitle>
									<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
										<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
									</div>
								</CardHeader>
								<CardContent className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6">
									<div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1" style={{ color: '#34C759' }}>
										{formatPrice(stats.monthlyRevenue)}
									</div>
									<p className="text-xs text-gray-500">{t('common.this_month')}</p>
								</CardContent>
							</Card>
						</div>

						{/* Pending Workshops */}
						<Card className="border-0 shadow-lg">
							<CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6" style={{ borderBottom: '2px solid #F0F0F0' }}>
								<div className="flex items-center gap-2 sm:gap-3">
									<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
										<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
									</div>
									<div>
										<CardTitle className="text-lg sm:text-xl font-bold" style={{ color: '#1C3F94' }}>
											{t('admin.workshops.pending_workshops')}
										</CardTitle>
										<CardDescription className="mt-1 text-xs sm:text-sm">{t('common.review_approve')}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
								{workshops.filter((w) => !w.isVerified).length === 0 ? (
									<div className="text-center py-8 sm:py-12">
										<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
											<CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
										</div>
										<h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#333333' }}>{t('admin.workshops.no_pending')}</h3>
										<p className="text-gray-500 text-sm sm:text-base">{t('common.all_approved')}</p>
									</div>
								) : (
									<div className="space-y-3 sm:space-y-4">
										{workshops
											.filter((w) => !w.isVerified)
											.map((workshop) => (
												<div key={workshop.id} className="border-2 rounded-xl p-3 sm:p-4 md:p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300" style={{ borderColor: '#E5E7EB' }}>
													<div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
														<div className="flex-1 w-full">
															<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
																<h3 className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#1C3F94' }}>{workshop.companyName}</h3>
																<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm w-fit" style={{ backgroundColor: '#FFF3CD', color: '#856404', border: 'none' }}>{t('common.pending')}</Badge>
															</div>
															<div className="space-y-1">
																<p className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-1 sm:gap-2">
																	<span className="font-medium">{t('admin.customers.email')}:</span> 
																	<span className="break-all">{workshop.email}</span>
																</p>
																<p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 sm:gap-2">
																	<Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
																	<span className="break-words">{t('common.registered')} {formatDate(new Date(workshop.createdAt))}</span>
																</p>
															</div>
														</div>
														<div className="flex gap-2 w-full sm:w-auto sm:ml-4">
															<Button
																size="sm"
																onClick={() => handleWorkshopAction(workshop.id, 'approve')}
																className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs sm:text-sm flex-1 sm:flex-initial"
															>
																<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
																<span className="hidden sm:inline">{t('admin.workshops.approve')}</span>
																<span className="sm:hidden">{t('admin.workshops.approve')}</span>
															</Button>
															<Button
																size="sm"
																onClick={() => handleWorkshopAction(workshop.id, 'reject')}
																className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs sm:text-sm flex-1 sm:flex-initial"
															>
																<XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
																<span className="hidden sm:inline">{t('admin.workshops.reject')}</span>
																<span className="sm:hidden">{t('admin.workshops.reject')}</span>
															</Button>
														</div>
													</div>
												</div>
											))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Customers Tab */}
				{activeTab === 'customers' && (
					<div className="space-y-4 sm:space-y-6">
						<Card className="border-0 shadow-lg">
							<CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6" style={{ borderBottom: '2px solid #F0F0F0' }}>
								<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
									<div className="flex items-center gap-2 sm:gap-3">
										<div className="p-1.5 sm:p-2 rounded-lg" style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}>
											<Users className="w-4 h-4 sm:w-5 sm:h-5" />
										</div>
										<div>
											<CardTitle className="text-lg sm:text-xl font-bold" style={{ color: '#1C3F94' }}>{t('admin.customers.title')}</CardTitle>
										</div>
									</div>
									<div className="flex-1 w-full sm:max-w-md relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
										<Input
											placeholder={t('admin.customers.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-9 sm:pl-10 h-9 sm:h-11 border-2 focus:border-blue-500 text-sm sm:text-base"
										/>
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-4 sm:pb-6">
								{listLoading ? (
									<div className="text-center py-8 sm:py-12">
										<RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.customers.loading_customers')}</p>
									</div>
								) : customers.length === 0 ? (
									<div className="text-center py-8 sm:py-12">
										<div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4" style={{ backgroundColor: '#F0F0F0' }}>
											<Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
										</div>
										<h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#333333' }}>{t('admin.customers.no_customers')}</h3>
										<p className="text-gray-500 text-sm sm:text-base">{t('admin.customers.no_customers_search')}</p>
									</div>
								) : (
									<div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#E5E7EB' }}>
										<table className="w-full min-w-[640px]">
											<thead>
												<tr style={{ backgroundColor: '#F9FAFB' }}>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.name')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.email')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.phone')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.city')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.requests')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.bookings')}</th>
													<th className="text-left p-2 sm:p-3 md:p-4 font-bold text-xs sm:text-sm uppercase tracking-wide" style={{ color: '#1C3F94' }}>{t('admin.customers.status')}</th>
												</tr>
											</thead>
											<tbody>
												{customers.map((customer, index) => (
													<tr key={customer.id} className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`} style={{ borderColor: '#E5E7EB' }}>
														<td className="p-2 sm:p-3 md:p-4 font-medium text-xs sm:text-sm">{customer.name || '-'}</td>
														<td className="p-2 sm:p-3 md:p-4 text-gray-700 text-xs sm:text-sm break-all">{customer.email}</td>
														<td className="p-2 sm:p-3 md:p-4 text-gray-600 text-xs sm:text-sm">{customer.phone || '-'}</td>
														<td className="p-2 sm:p-3 md:p-4 text-gray-600 text-xs sm:text-sm">{customer.city || '-'}</td>
														<td className="p-2 sm:p-3 md:p-4">
															<span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold" style={{ backgroundColor: '#E3F2FD', color: '#1C3F94' }}>
																{customer._count?.requests || 0}
															</span>
														</td>
														<td className="p-2 sm:p-3 md:p-4">
															<span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold" style={{ backgroundColor: '#E8F5E9', color: '#34C759' }}>
																{customer._count?.bookings || 0}
															</span>
														</td>
														<td className="p-2 sm:p-3 md:p-4">
															<Badge className="px-2 sm:px-3 py-0.5 sm:py-1 font-semibold text-xs sm:text-sm" variant={customer.isActive ? 'default' : 'secondary'} style={customer.isActive ? { backgroundColor: '#34C759', color: '#FFFFFF' } : {}}>
																{customer.isActive ? t('admin.customers.active') : t('admin.customers.inactive')}
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Workshops Tab */}
				{activeTab === 'workshops' && (
					<div className="space-y-4 sm:space-y-6">
						<Card>
							<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
								<CardTitle className="text-lg sm:text-xl">{t('admin.workshops.title')}</CardTitle>
								<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4">
									<div className="flex-1 relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.workshops.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base"
										/>
									</div>
									<Select
										value={statusFilter}
										onValueChange={(value) => {
											setStatusFilter(value)
											setPagination({ ...pagination, page: 1 })
										}}
									>
										<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
											<SelectItem value="verified">{t('admin.workshops.verified')}</SelectItem>
											<SelectItem value="pending">{t('common.pending')}</SelectItem>
											<SelectItem value="active">{t('admin.workshops.active')}</SelectItem>
											<SelectItem value="blocked">{t('admin.workshops.blocked')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardHeader>
							<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
								{listLoading ? (
									<div className="text-center py-8">
										<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
									</div>
								) : workshops.length === 0 ? (
									<div className="text-center py-8">
										<Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.workshops.no_workshops')}</p>
									</div>
								) : (
									<div className="space-y-3 sm:space-y-4">
										{workshops.map((workshop) => (
											<div key={workshop.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
												<div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
													<div className="flex-1 w-full">
														<h3 className="font-semibold text-base sm:text-lg mb-1">{workshop.companyName}</h3>
														<p className="text-xs sm:text-sm text-gray-600 break-all">{workshop.email}</p>
														<p className="text-xs sm:text-sm text-gray-500">{workshop.organizationNumber}</p>
														<div className="flex flex-wrap gap-2 sm:gap-4 mt-2">
															<span className="text-xs sm:text-sm">
																{t('admin.workshops.offers')}: {workshop._count?.offers || 0}
															</span>
															<span className="text-xs sm:text-sm">
																{t('admin.workshops.bookings')}: {workshop._count?.bookings || 0}
															</span>
															<span className="text-xs sm:text-sm">
																{t('admin.workshops.reviews')}: {workshop._count?.reviews || 0}
															</span>
														</div>
													</div>
													<div className="flex flex-wrap gap-2 w-full sm:w-auto">
														{workshop.isVerified ? (
															<Badge className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1" style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}>
																{t('admin.workshops.verified')}
															</Badge>
														) : (
															<Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">{t('admin.workshops.not_verified')}</Badge>
														)}
														{workshop.isActive ? (
															<Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">{t('admin.workshops.active')}</Badge>
														) : (
															<Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">{t('admin.workshops.blocked')}</Badge>
														)}
													</div>
												</div>
												<div className="flex flex-wrap gap-2">
													{!workshop.isVerified && (
														<Button
															size="sm"
															onClick={() => handleWorkshopAction(workshop.id, 'approve')}
															className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs sm:text-sm"
														>
															<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
															{t('admin.workshops.approve')}
														</Button>
													)}
													{workshop.isActive ? (
														<Button
															size="sm"
															onClick={() => handleWorkshopAction(workshop.id, 'block')}
															className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 text-xs sm:text-sm"
														>
															<Ban className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
															{t('admin.workshops.block')}
														</Button>
													) : (
														<Button
															size="sm"
															onClick={() => handleWorkshopAction(workshop.id, 'unblock')}
															className="font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-md px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 hover:text-green-800 text-xs sm:text-sm"
														>
															<Unlock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
															{t('admin.workshops.unblock')}
														</Button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Requests Tab */}
				{activeTab === 'requests' && (
					<div className="space-y-4 sm:space-y-6">
						<Card>
							<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
								<CardTitle className="text-lg sm:text-xl">{t('admin.requests.title')}</CardTitle>
								<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4">
									<div className="flex-1 relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<Input
											placeholder={t('admin.requests.search')}
											value={searchQuery}
											onChange={(e) => {
												setSearchQuery(e.target.value)
												setPagination({ ...pagination, page: 1 })
											}}
											className="pl-10 h-9 sm:h-10 text-sm sm:text-base"
										/>
									</div>
									<Select
										value={statusFilter}
										onValueChange={(value) => {
											setStatusFilter(value)
											setPagination({ ...pagination, page: 1 })
										}}
									>
										<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
											<SelectItem value="NEW">{t('admin.requests.new')}</SelectItem>
											<SelectItem value="IN_BIDDING">{t('admin.requests.in_bidding')}</SelectItem>
											<SelectItem value="BOOKED">{t('admin.requests.booked')}</SelectItem>
											<SelectItem value="COMPLETED">{t('admin.requests.completed')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardHeader>
							<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
								{listLoading ? (
									<div className="text-center py-8">
										<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
									</div>
								) : requests.length === 0 ? (
									<div className="text-center py-8">
										<FileText className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.requests.no_requests')}</p>
									</div>
								) : (
									<div className="space-y-3 sm:space-y-4">
										{requests.map((request) => (
											<div key={request.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
												<div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
													<div className="flex-1 w-full">
														<h3 className="font-semibold text-base sm:text-lg mb-1">
															{request.vehicle?.make} {request.vehicle?.model} ({request.vehicle?.year})
														</h3>
														<p className="text-xs sm:text-sm text-gray-600 break-all">{request.customer?.name || request.customer?.email}</p>
														<p className="text-xs sm:text-sm text-gray-500">
															{request.city}, {request.address}
														</p>
														<p className="text-xs sm:text-sm text-gray-500">
															{t('admin.requests.created')}: {formatDate(new Date(request.createdAt))}
														</p>
													</div>
													<div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
														<Badge
															className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1"
															variant={
																request.status === 'COMPLETED'
																	? 'default'
																	: request.status === 'BOOKED'
																	? 'default'
																	: 'secondary'
															}
														>
															{request.status === 'NEW' ? t('admin.requests.new') : request.status === 'IN_BIDDING' ? t('admin.requests.in_bidding') : request.status === 'BIDDING_CLOSED' ? t('admin.requests.bidding_closed') : request.status === 'BOOKED' ? t('admin.requests.booked') : request.status === 'COMPLETED' ? t('admin.requests.completed') : request.status === 'CANCELLED' ? t('admin.requests.cancelled') : request.status}
														</Badge>
														<span className="text-xs sm:text-sm text-gray-600">
															{t('admin.requests.offers')}: {request._count?.offers || 0}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Offers Tab */}
				{activeTab === 'offers' && (
					<div className="space-y-4 sm:space-y-6">
						<Card>
							<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
								<CardTitle className="text-lg sm:text-xl">{t('admin.offers.title')}</CardTitle>
							</CardHeader>
							<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
								{listLoading ? (
									<div className="text-center py-8">
										<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
									</div>
								) : offers.length === 0 ? (
									<div className="text-center py-8">
										<Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.offers.no_offers')}</p>
									</div>
								) : (
									<div className="space-y-3 sm:space-y-4">
										{offers.map((offer) => (
											<div key={offer.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
												<div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
													<div className="flex-1 w-full">
														<h3 className="font-semibold text-base sm:text-lg mb-1">{offer.workshop?.companyName}</h3>
														<p className="text-xs sm:text-sm text-gray-600">
															{offer.request?.vehicle?.make} {offer.request?.vehicle?.model}
														</p>
														<p className="text-xs sm:text-sm font-semibold mt-2" style={{ color: '#1C3F94' }}>
															{formatPrice(offer.price)}
														</p>
													</div>
													<div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
														<Badge className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1" variant={offer.status === 'ACCEPTED' ? 'default' : 'secondary'}>
															{offer.status === 'SENT' ? t('admin.offers.sent') : offer.status === 'ACCEPTED' ? t('admin.offers.accepted') : offer.status === 'DECLINED' ? t('admin.offers.declined') : offer.status === 'EXPIRED' ? t('admin.offers.expired') : offer.status}
														</Badge>
														<span className="text-xs sm:text-sm text-gray-500">
															{formatDate(new Date(offer.createdAt))}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Bookings Tab */}
				{activeTab === 'bookings' && (
					<div className="space-y-4 sm:space-y-6">
						<Card>
							<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
								<CardTitle className="text-lg sm:text-xl">{t('admin.bookings.title')}</CardTitle>
								<div className="flex gap-3 sm:gap-4 mt-3 sm:mt-4">
									<Select
										value={statusFilter}
										onValueChange={(value) => {
											setStatusFilter(value)
											setPagination({ ...pagination, page: 1 })
										}}
									>
										<SelectTrigger className="w-full sm:w-40 h-9 sm:h-10 text-sm sm:text-base">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">{t('admin.filters.all')}</SelectItem>
											<SelectItem value="CONFIRMED">{t('admin.bookings.confirmed')}</SelectItem>
											<SelectItem value="DONE">{t('admin.bookings.done')}</SelectItem>
											<SelectItem value="CANCELLED">{t('admin.bookings.cancelled')}</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</CardHeader>
							<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
								{listLoading ? (
									<div className="text-center py-8">
										<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
									</div>
								) : bookings.length === 0 ? (
									<div className="text-center py-8">
										<Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.bookings.no_bookings')}</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="w-full min-w-[640px]">
											<thead>
												<tr className="border-b">
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.customer')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.workshop')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.scheduled')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.amount')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.commission')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.bookings.status')}</th>
												</tr>
											</thead>
											<tbody>
												{bookings.map((booking) => (
													<tr key={booking.id} className="border-b hover:bg-gray-50">
														<td className="p-2 sm:p-3 text-xs sm:text-sm break-all">{booking.customer?.name || booking.customer?.email}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{booking.workshop?.companyName}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDateTime(new Date(booking.scheduledAt))}</td>
														<td className="p-2 sm:p-3 font-semibold text-xs sm:text-sm">{formatPrice(booking.totalAmount)}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm" style={{ color: '#34C759' }}>
															{formatPrice(booking.commission)}
														</td>
														<td className="p-2 sm:p-3">
															<Badge
																className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1"
																variant={
																	booking.status === 'DONE'
																		? 'default'
																		: booking.status === 'CANCELLED'
																		? 'destructive'
																		: 'secondary'
																}
															>
																{booking.status === 'CONFIRMED' ? t('admin.bookings.confirmed') : booking.status === 'RESCHEDULED' ? t('admin.bookings.rescheduled') : booking.status === 'CANCELLED' ? t('admin.bookings.cancelled') : booking.status === 'DONE' ? t('admin.bookings.done') : booking.status === 'NO_SHOW' ? t('admin.bookings.no_show') : booking.status}
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}

				{/* Payouts Tab */}
				{activeTab === 'payouts' && (
					<div className="space-y-4 sm:space-y-6">
						<Card>
							<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
								<CardTitle className="text-lg sm:text-xl">{t('admin.payouts.title')}</CardTitle>
								<CardDescription className="text-xs sm:text-sm mt-1">{t('admin.payouts.subtitle')}</CardDescription>
								<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-3 sm:mt-4">
									<Input
										type="number"
										placeholder={t('admin.payouts.month')}
										value={payoutMonth}
										onChange={(e) => setPayoutMonth(Number(e.target.value))}
										min={1}
										max={12}
										className="w-full sm:w-32 h-9 sm:h-10 text-sm sm:text-base"
									/>
									<Input
										type="number"
										placeholder={t('admin.payouts.year')}
										value={payoutYear}
										onChange={(e) => setPayoutYear(Number(e.target.value))}
										min={2020}
										max={2100}
										className="w-full sm:w-32 h-9 sm:h-10 text-sm sm:text-base"
									/>
									<Button
										onClick={handleGeneratePayouts}
										disabled={generating}
										className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										{generating ? (
											<>
												<RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
												{t('admin.payouts.generating')}
											</>
										) : (
											<>
												<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
												{t('admin.payouts.generate')}
											</>
										)}
									</Button>
									{payouts.length > 0 && (
										<Button
											variant="outline"
											onClick={() => exportToCSV(payouts, `payouts-${payoutYear}-${payoutMonth}.csv`)}
											className="w-full sm:w-auto h-9 sm:h-10 text-sm sm:text-base"
										>
											{t('admin.payouts.export_csv')}
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
								{loading ? (
									<div className="text-center py-8">
										<RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#1C3F94' }} />
										<p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
									</div>
								) : payouts.length === 0 ? (
									<div className="text-center py-8">
										<CreditCard className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
										<p className="text-gray-600 text-sm sm:text-base">{t('admin.payouts.no_reports')}</p>
										<p className="text-xs sm:text-sm text-gray-500 mt-2">{t('admin.payouts.select_month_year')}</p>
									</div>
								) : (
									<div className="overflow-x-auto">
										<table className="w-full min-w-[800px]">
											<thead>
												<tr className="border-b">
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.workshop')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.month')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.year')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.total_jobs')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.total_amount')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.commission')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.workshop_amount')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('admin.payouts.status')}</th>
													<th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">{t('common.actions')}</th>
												</tr>
											</thead>
											<tbody>
												{payouts.map((payout) => (
													<tr key={payout.id} className="border-b hover:bg-gray-50">
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{payout.workshop?.companyName}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{payout.month}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{payout.year}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm">{payout.totalJobs}</td>
														<td className="p-2 sm:p-3 font-semibold text-xs sm:text-sm">{formatPrice(payout.totalAmount)}</td>
														<td className="p-2 sm:p-3 text-xs sm:text-sm" style={{ color: '#34C759' }}>
															{formatPrice(payout.commission)}
														</td>
														<td className="p-2 sm:p-3 font-semibold text-xs sm:text-sm">{formatPrice(payout.workshopAmount)}</td>
														<td className="p-2 sm:p-3">
															<Badge className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1" variant={payout.isPaid ? 'default' : 'secondary'}>
																{payout.isPaid ? t('admin.payouts.paid') : t('admin.payouts.unpaid')}
															</Badge>
														</td>
														<td className="p-2 sm:p-3">
															{!payout.isPaid && (
																<Button
																	size="sm"
																	onClick={() => handleMarkPayoutPaid(payout.id)}
																	className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
																	style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
																>
																	<CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
																	<span className="hidden sm:inline">{t('admin.payouts.mark_paid')}</span>
																	<span className="sm:hidden">{t('admin.payouts.mark_paid')}</span>
																</Button>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</div>
	)
}
