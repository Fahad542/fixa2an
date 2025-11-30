import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

export default function SignUpPage() {
	const { t } = useTranslation()
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
		address: '',
		city: '',
		postalCode: '',
	})
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [fieldErrors, setFieldErrors] = useState({})
	const { register } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async (e) => {
		e.preventDefault()
		setIsLoading(true)
		setFieldErrors({})

		if (formData.password !== formData.confirmPassword) {
			setFieldErrors({ confirmPassword: 'Passwords do not match' })
			toast.error('Passwords do not match')
			setIsLoading(false)
			return
		}

		try {
			const result = await register({
				name: formData.name,
				email: formData.email,
				password: formData.password,
				phone: formData.phone,
				address: formData.address,
				city: formData.city,
				postalCode: formData.postalCode,
				role: 'CUSTOMER',
			})

			if (result.success) {
				toast.success('Account created successfully! Please sign in.')
				navigate('/auth/signin')
			} else {
				if (result.errors) {
					setFieldErrors(result.errors)
					const firstError = Object.values(result.errors)[0]
					if (firstError) {
						toast.error(firstError)
					}
				} else {
					toast.error(result.message || 'Registration failed')
				}
			}
		} catch (error) {
			toast.error('An error occurred. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
		// Clear error for this field when user starts typing
		if (fieldErrors[e.target.name]) {
			setFieldErrors({
				...fieldErrors,
				[e.target.name]: '',
			})
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#1C3F94]/5 via-white to-[#34C759]/5 flex flex-col relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-[#1C3F94]/5 rounded-full blur-3xl -ml-48 -mt-48"></div>
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-[#34C759]/5 rounded-full blur-3xl -mr-48 -mb-48"></div>
			<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1C3F94]/3 rounded-full blur-3xl"></div>
			
			<Navbar />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-20 relative z-10">
				<div className="max-w-2xl w-full space-y-8 animate-fade-in-up">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1C3F94] to-[#1C3F94]/80 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform">
							<UserPlus className="w-10 h-10 text-white" />
						</div>
						<h2 className="text-4xl font-bold text-gray-900 mb-2">{t('auth.signup.title')}</h2>
						<p className="text-gray-600">
							{t('auth.signup.subtitle')}{' '}
							<Link to="/auth/signin" className="font-semibold text-[#1C3F94] hover:text-[#1C3F94]/80 transition-colors underline-offset-4 hover:underline">
								{t('navigation.login')}
							</Link>
						</p>
						<p className="mt-3 text-sm text-gray-600">
							{t('auth.signup.workshop_signup_text')}{' '}
							<Link to="/workshop/signup" className="font-semibold text-[#1C3F94] hover:text-[#1C3F94]/80 transition-colors underline-offset-4 hover:underline">
								{t('auth.signup.workshop_signup_link')}
							</Link>
						</p>
					</div>

					<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-200/50">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<User className="w-4 h-4 text-gray-500" />
											{t('auth.signup.name')}
										</div>
									</label>
									<input
										id="name"
										name="name"
										type="text"
										value={formData.name}
										onChange={handleChange}
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
										placeholder={t('auth.signup.name')}
									/>
									{fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
								</div>

								<div>
									<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Mail className="w-4 h-4 text-gray-500" />
											{t('auth.signup.email')} *
										</div>
									</label>
									<input
										id="email"
										name="email"
										type="email"
										value={formData.email}
										onChange={handleChange}
										required
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
										placeholder={t('auth.signup.email')}
									/>
									{fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.password')} *
										</div>
									</label>
									<div className="relative">
										<input
											id="password"
											name="password"
											type={showPassword ? 'text' : 'password'}
											value={formData.password}
											onChange={handleChange}
											required
											className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all pr-12 bg-gray-50/50 hover:bg-white"
											placeholder={t('auth.signup.password')}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
									{fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
								</div>

								<div>
									<label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Lock className="w-4 h-4 text-gray-500" />
											{t('auth.signup.confirm_password')} *
										</div>
									</label>
									<div className="relative">
										<input
											id="confirmPassword"
											name="confirmPassword"
											type={showConfirmPassword ? 'text' : 'password'}
											value={formData.confirmPassword}
											onChange={handleChange}
											required
											className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all pr-12 bg-gray-50/50 hover:bg-white"
											placeholder={t('auth.signup.confirm_password')}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
										>
											{showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
										</button>
									</div>
									{fieldErrors.confirmPassword && (
										<p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
									)}
								</div>
							</div>

							<div>
								<label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Phone className="w-4 h-4 text-gray-500" />
										{t('auth.signup.phone')}
									</div>
								</label>
								<input
									id="phone"
									name="phone"
									type="tel"
									value={formData.phone}
									onChange={handleChange}
									className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
									placeholder={t('auth.signup.phone')}
								/>
							</div>

							<div>
								<label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<MapPin className="w-4 h-4 text-gray-500" />
										{t('auth.signup.address')}
									</div>
								</label>
								<input
									id="address"
									name="address"
									type="text"
									value={formData.address}
									onChange={handleChange}
									className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
									placeholder={t('auth.signup.address')}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<Building2 className="w-4 h-4 text-gray-500" />
											{t('auth.signup.city')}
										</div>
									</label>
									<input
										id="city"
										name="city"
										type="text"
										value={formData.city}
										onChange={handleChange}
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
										placeholder={t('auth.signup.city')}
									/>
								</div>
								<div>
									<label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
										<div className="flex items-center gap-2">
											<MapPin className="w-4 h-4 text-gray-500" />
											{t('auth.signup.postal_code')}
										</div>
									</label>
									<input
										id="postalCode"
										name="postalCode"
										type="text"
										value={formData.postalCode}
										onChange={handleChange}
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
										placeholder={t('auth.signup.postal_code')}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-[#1C3F94] to-[#1C3F94]/90 hover:from-[#1C3F94]/90 hover:to-[#1C3F94] focus:outline-none focus:ring-4 focus:ring-[#1C3F94]/30 disabled:opacity-50 transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
							>
								{isLoading ? (
									<>
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Creating account...
									</>
								) : (
									<>
										<UserPlus className="w-5 h-5" />
										Create Account
									</>
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}
