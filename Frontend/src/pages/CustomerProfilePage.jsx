import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	User,
	Mail,
	Phone,
	MapPin,
	Edit,
	Save,
	X,
	FileText,
	CheckCircle,
	Clock,
	XCircle,
	Calendar,
	DollarSign,
	Star,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { authAPI, requestsAPI, bookingsAPI } from '../services/api'

export default function CustomerProfilePage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, fetchUser } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeRequests: 0,
		completedBookings: 0,
		cancelledBookings: 0,
		totalSpend: 0,
	})
	const [profileData, setProfileData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
		city: '',
		postalCode: '',
	})
	const [originalProfileData, setOriginalProfileData] = useState({})

	// Redirect if not authenticated or wrong role
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
					navigate('/workshop/profile', { replace: true })
				}
			}
		}
	}, [user, authLoading, navigate])

	const fetchData = async () => {
		if (!user || user.role !== 'CUSTOMER') return

		try {
			// Fetch user profile
			const userResponse = await authAPI.getMe()
			if (userResponse.data) {
				const userData = userResponse.data
				const profile = {
					name: userData?.name || '',
					email: userData?.email || '',
					phone: userData?.phone || '',
					address: userData?.address || '',
					city: userData?.city || '',
					postalCode: userData?.postalCode || '',
				}
				setProfileData(profile)
				setOriginalProfileData(profile)
			}

			// Fetch customer stats
			const userId = user._id || user.id
			
			// Fetch requests
			const requestsResponse = await requestsAPI.getByCustomer(userId)
			const requests = requestsResponse.data || []
			
			// Fetch bookings
			const bookingsResponse = await bookingsAPI.getByCustomer(userId)
			const bookings = bookingsResponse.data || []

			// Calculate stats
			const totalRequests = requests.length
			const activeRequests = requests.filter(r => r.status === 'NEW' || r.status === 'IN_BIDDING' || r.status === 'ACCEPTED').length
			const completedBookings = bookings.filter(b => b.status === 'DONE').length
			const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length
			const totalSpend = bookings
				.filter(b => b.status === 'DONE')
				.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)

			setStats({
				totalRequests,
				activeRequests,
				completedBookings,
				cancelledBookings,
				totalSpend,
			})
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('profile.fetch_error') || 'Failed to fetch profile data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'CUSTOMER') {
			fetchData()
		}
	}, [user])

	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			const userId = user._id || user.id
			await authAPI.updateProfile(userId, {
				name: profileData.name,
				phone: profileData.phone,
				address: profileData.address,
				city: profileData.city,
				postalCode: profileData.postalCode,
			})

			toast.success(t('profile.update_success') || 'Profile updated successfully')
			setOriginalProfileData(profileData)
			setIsEditing(false)
			
			// Refresh user data
			if (fetchUser) {
				await fetchUser()
			}
			
			// Refresh profile data
			await fetchData()
		} catch (error) {
			console.error('Failed to update profile:', error)
			toast.error(t('profile.update_error') || 'Failed to update profile')
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setProfileData(originalProfileData)
		setIsEditing(false)
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
				<Navbar />
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
						<User className="w-10 h-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
					</div>
					<p className="text-gray-600 font-medium text-lg">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user || user.role !== 'CUSTOMER') {
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12">
				{/* Header Section */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
								{t('profile.title') || 'My Profile'}
							</h1>
							<p className="text-gray-600 text-sm sm:text-base">
								{t('profile.subtitle') || 'Manage your profile and view statistics'}
							</p>
						</div>
						{!isEditing && (
							<Button
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
							>
								<Edit className="w-4 h-4" />
								{t('profile.edit') || 'Edit Profile'}
							</Button>
						)}
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<FileText className="w-5 h-5 text-blue-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.totalRequests}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('profile.my_cases') || 'Total Requests'}
							</h3>
							<p className="text-xs text-gray-500">All requests</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-yellow-100 rounded-lg">
									<Clock className="w-5 h-5 text-yellow-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.activeRequests}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('profile.booked_cases') || 'Active Requests'}
							</h3>
							<p className="text-xs text-gray-500">In progress</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckCircle className="w-5 h-5 text-green-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.completedBookings}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('profile.completed_cases') || 'Completed'}
							</h3>
							<p className="text-xs text-gray-500">Finished</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-red-100 rounded-lg">
									<XCircle className="w-5 h-5 text-red-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.cancelledBookings}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('profile.cancelled_cases') || 'Cancelled'}
							</h3>
							<p className="text-xs text-gray-500">Cancelled</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-amber-100 rounded-lg">
									<DollarSign className="w-5 h-5 text-amber-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">
									{formatPrice(stats.totalSpend)}
								</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('profile.total_spend') || 'Total Spend'}
							</h3>
							<p className="text-xs text-gray-500">All time</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
						<CardHeader className="border-b border-gray-200 bg-white">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-600 rounded-lg">
										<User className="w-5 h-5 text-white" />
									</div>
									<CardTitle className="text-xl font-bold text-gray-900">
										{t('profile.profile_info') || 'Profile Information'}
									</CardTitle>
								</div>
								{isEditing && (
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleCancel}
											disabled={isSaving}
											className="flex items-center gap-2"
										>
											<X className="w-4 h-4" />
											Cancel
										</Button>
										<Button
											size="sm"
											onClick={handleSave}
											disabled={isSaving}
											className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
										>
											<Save className="w-4 h-4" />
											{isSaving ? 'Saving...' : 'Save'}
										</Button>
									</div>
								)}
							</div>
						</CardHeader>
						<CardContent className="p-6 space-y-6">
							{/* Personal Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<User className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-sm font-medium text-gray-700">
											{t('profile.name') || 'Name'}
										</Label>
										{isEditing ? (
											<Input
												id="name"
												value={profileData.name}
												onChange={(e) => handleInputChange('name', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.name || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email" className="text-sm font-medium text-gray-700">
											{t('profile.email') || 'Email'}
										</Label>
										<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
											{profileData.email || 'N/A'}
										</div>
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-sm font-medium text-gray-700">
											{t('profile.phone') || 'Phone'}
										</Label>
										{isEditing ? (
											<Input
												id="phone"
												type="tel"
												value={profileData.phone}
												onChange={(e) => handleInputChange('phone', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.phone || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Address Information */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<MapPin className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="address" className="text-sm font-medium text-gray-700">
											{t('profile.address') || 'Address'}
										</Label>
										{isEditing ? (
											<Input
												id="address"
												value={profileData.address}
												onChange={(e) => handleInputChange('address', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.address || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="city" className="text-sm font-medium text-gray-700">
											{t('profile.city') || 'City'}
										</Label>
										{isEditing ? (
											<Input
												id="city"
												value={profileData.city}
												onChange={(e) => handleInputChange('city', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.city || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
											{t('profile.postal_code') || 'Postal Code'}
										</Label>
										{isEditing ? (
											<Input
												id="postalCode"
												value={profileData.postalCode}
												onChange={(e) => handleInputChange('postalCode', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.postalCode || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Actions Sidebar */}
					<div className="space-y-6">
						<Card className="bg-white border border-gray-200 shadow-sm">
							<CardHeader className="border-b border-gray-200 bg-white">
								<CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
									<Calendar className="w-5 h-5 text-blue-500" />
									Quick Actions
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-3">
									<Button
										onClick={() => navigate('/my-cases')}
										className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
									>
										<FileText className="w-4 h-4 mr-2" />
										View My Cases
									</Button>
									<Button
										onClick={() => navigate('/upload')}
										variant="outline"
										className="w-full justify-start"
									>
										<FileText className="w-4 h-4 mr-2" />
										Create New Request
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}

