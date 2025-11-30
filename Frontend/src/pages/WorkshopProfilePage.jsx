import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/cn'
import { useTranslation } from 'react-i18next'
import {
	User,
	Building2,
	Mail,
	Phone,
	MapPin,
	Globe,
	FileText,
	Edit,
	Save,
	X,
	Users,
	DollarSign,
	CheckCircle,
	Star,
	Calendar,
	Send,
	FileCheck,
	Briefcase,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { workshopAPI, authAPI } from '../services/api'

export default function WorkshopProfilePage() {
	const navigate = useNavigate()
	const { user, loading: authLoading, fetchUser } = useAuth()
	const { t } = useTranslation()
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [stats, setStats] = useState({
		totalRequests: 0,
		activeOffers: 0,
		completedJobs: 0,
		totalRevenue: 0,
		completedContracts: 0,
		proposalsSent: 0,
		rating: 0,
		reviewCount: 0,
	})
	const [profileData, setProfileData] = useState({
		name: '',
		email: '',
		phone: '',
		companyName: '',
		organizationNumber: '',
		address: '',
		city: '',
		postalCode: '',
		website: '',
		description: '',
	})
	const [originalProfileData, setOriginalProfileData] = useState({})

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
			// Fetch stats
			const statsResponse = await workshopAPI.getStats()
			if (statsResponse.data) {
				setStats({
					totalRequests: statsResponse.data.totalRequests || 0,
					activeOffers: statsResponse.data.activeOffers || 0,
					completedJobs: statsResponse.data.completedJobs || 0,
					totalRevenue: statsResponse.data.totalRevenue || 0,
					completedContracts: statsResponse.data.completedContracts || 0,
					proposalsSent: statsResponse.data.proposalsSent || 0,
					rating: statsResponse.data.rating || 0,
					reviewCount: statsResponse.data.reviewCount || 0,
				})
			}

			// Fetch workshop profile data
			const profileResponse = await workshopAPI.getProfile()
			if (profileResponse.data) {
				const { user: userData, workshop: workshopData } = profileResponse.data
				const profile = {
					name: userData?.name || '',
					email: userData?.email || workshopData?.email || '',
					phone: userData?.phone || workshopData?.phone || '',
					companyName: workshopData?.companyName || '',
					organizationNumber: workshopData?.organizationNumber || '',
					address: workshopData?.address || '',
					city: workshopData?.city || '',
					postalCode: workshopData?.postalCode || '',
					website: workshopData?.website || '',
					description: workshopData?.description || '',
				}
				setProfileData(profile)
				setOriginalProfileData(profile)
			}
		} catch (error) {
			console.error('Failed to fetch data:', error)
			toast.error(t('workshop.profile.fetch_error') || 'Failed to fetch profile data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (user && user.role === 'WORKSHOP') {
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
			// Update workshop profile
			await workshopAPI.updateProfile({
				name: profileData.name,
				phone: profileData.phone,
				email: profileData.email,
				companyName: profileData.companyName,
				organizationNumber: profileData.organizationNumber,
				address: profileData.address,
				city: profileData.city,
				postalCode: profileData.postalCode,
				website: profileData.website,
				description: profileData.description,
			})

			toast.success(t('workshop.profile.update_success') || 'Profile updated successfully')
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
			toast.error(t('workshop.profile.update_error') || 'Failed to update profile')
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

	if (!user || user.role !== 'WORKSHOP') {
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
								{t('workshop.profile.title') || 'Profile'}
							</h1>
							<p className="text-gray-600 text-sm sm:text-base">
								{t('workshop.profile.subtitle') || 'Manage your workshop profile and view statistics'}
							</p>
						</div>
						{!isEditing && (
							<Button
								onClick={() => setIsEditing(true)}
								className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
							>
								<Edit className="w-4 h-4" />
								{t('workshop.profile.edit') || 'Edit Profile'}
							</Button>
						)}
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Users className="w-5 h-5 text-blue-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.totalRequests}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.total_requests') || 'Total Requests'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.total_requests_desc') || 'Available requests'}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<CheckCircle className="w-5 h-5 text-green-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.activeOffers}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.active_offers') || 'Active Offers'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.active_offers_desc') || 'Pending customer response'}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-emerald-100 rounded-lg">
									<Calendar className="w-5 h-5 text-emerald-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.completedJobs}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.completed_jobs') || 'Completed Jobs'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.completed_jobs_desc') || 'Successfully completed'}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-amber-100 rounded-lg">
									<DollarSign className="w-5 h-5 text-amber-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">
									{formatPrice(stats.totalRevenue)}
								</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.total_revenue') || 'Total Revenue'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.total_revenue_desc') || 'From completed jobs'}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-purple-100 rounded-lg">
									<FileCheck className="w-5 h-5 text-purple-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.completedContracts}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.completed_contracts') || 'Completed Contracts'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.completed_contracts_desc') || 'Successfully completed'}
							</p>
						</CardContent>
					</Card>

					<Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
						<CardContent className="p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="p-3 bg-pink-100 rounded-lg">
									<Send className="w-5 h-5 text-pink-600" />
								</div>
								<span className="text-2xl font-bold text-gray-900">{stats.proposalsSent}</span>
							</div>
							<h3 className="text-sm font-semibold text-gray-900 mb-1">
								{t('workshop.profile.stats.proposals_sent') || 'Proposals Sent'}
							</h3>
							<p className="text-xs text-gray-500">
								{t('workshop.profile.stats.proposals_sent_desc') || 'Total proposals sent'}
							</p>
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
										<Briefcase className="w-5 h-5 text-white" />
									</div>
									<CardTitle className="text-xl font-bold text-gray-900">
										{t('workshop.profile.profile_info') || 'Profile Information'}
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
						<CardContent className="p-6 space-y-8">
							{/* Personal Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<User className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.name') || 'Name'}
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
											{t('workshop.profile.email') || 'Email'}
										</Label>
										{isEditing ? (
											<Input
												id="email"
												type="email"
												value={profileData.email}
												onChange={(e) => handleInputChange('email', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.email || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="phone" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.phone') || 'Phone'}
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

							{/* Company Details */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<Building2 className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.company_name') || 'Company Name'}
										</Label>
										{isEditing ? (
											<Input
												id="companyName"
												value={profileData.companyName}
												onChange={(e) => handleInputChange('companyName', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.companyName || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="organizationNumber" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.organization_number') || 'Organization Number'}
										</Label>
										{isEditing ? (
											<Input
												id="organizationNumber"
												value={profileData.organizationNumber}
												onChange={(e) => handleInputChange('organizationNumber', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.organizationNumber || 'N/A'}
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
											{t('workshop.profile.address') || 'Address'}
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
											{t('workshop.profile.city') || 'City'}
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
											{t('workshop.profile.postal_code') || 'Postal Code'}
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

							{/* Additional Information */}
							<div>
								<div className="flex items-center gap-2 mb-4">
									<Globe className="w-5 h-5 text-gray-600" />
									<h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
								</div>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="website" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.website') || 'Website'}
										</Label>
										{isEditing ? (
											<Input
												id="website"
												type="url"
												value={profileData.website}
												onChange={(e) => handleInputChange('website', e.target.value)}
												disabled={isSaving}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
												{profileData.website || 'N/A'}
											</div>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="description" className="text-sm font-medium text-gray-700">
											{t('workshop.profile.description') || 'Description'}
										</Label>
										{isEditing ? (
											<Textarea
												id="description"
												value={profileData.description}
												onChange={(e) => handleInputChange('description', e.target.value)}
												disabled={isSaving}
												rows={4}
												className="w-full"
											/>
										) : (
											<div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">
												{profileData.description || 'N/A'}
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Stats Sidebar */}
					<div className="space-y-6">
						<Card className="bg-white border border-gray-200 shadow-sm">
							<CardHeader className="border-b border-gray-200 bg-white">
								<CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
									<Star className="w-5 h-5 text-amber-500" />
									Quick Stats
								</CardTitle>
							</CardHeader>
							<CardContent className="p-6">
								<div className="space-y-6">
									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-600">Rating</span>
											<span className="text-2xl font-bold text-gray-900">
												{stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}
											</span>
										</div>
										{stats.rating > 0 && (
											<div className="flex items-center gap-1">
												{[...Array(5)].map((_, i) => (
													<Star
														key={i}
														className={`w-4 h-4 ${
															i < Math.round(stats.rating)
																? 'text-amber-400 fill-amber-400'
																: 'text-gray-300'
														}`}
													/>
												))}
											</div>
										)}
									</div>
									<div className="pt-4 border-t border-gray-200">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-600">Reviews</span>
											<span className="text-xl font-bold text-gray-900">{stats.reviewCount}</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	)
}
