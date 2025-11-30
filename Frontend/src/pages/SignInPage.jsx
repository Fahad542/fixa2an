import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useTranslation } from 'react-i18next'

export default function SignInPage() {
	const { t } = useTranslation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async (e) => {
		e.preventDefault()
		e.stopPropagation()
		
		// Trim email and password
		const trimmedEmail = email.trim()
		const trimmedPassword = password.trim()
		
		if (!trimmedEmail || !trimmedPassword) {
			toast.error('Please fill in all fields')
			return
		}
		
		setIsLoading(true)

		try {
			const result = await login(trimmedEmail, trimmedPassword)
			
			if (result.success) {
				toast.success('Login successful!')
				
				// Redirect based on role from result
				const role = result.user?.role?.toUpperCase()
				
				if (role === 'ADMIN') {
					navigate('/admin')
				} else if (role === 'WORKSHOP') {
					navigate('/workshop/requests')
				} else {
					navigate('/my-cases')
				}
			} else {
				toast.error(result.message || 'Invalid credentials')
				setIsLoading(false)
			}
		} catch (error) {
			console.error('Login exception:', error)
			toast.error(error.message || 'An error occurred. Please try again.')
			setIsLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#1C3F94]/5 via-white to-[#1C3F94]/10 flex flex-col relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-[#1C3F94]/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-[#34C759]/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
			
			<Navbar />
			<div className="flex-1 flex items-center justify-center px-4 py-12 pt-20 relative z-10">
				<div className="max-w-md w-full space-y-8 animate-fade-in-up">
					<div className="text-center">
						<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1C3F94] to-[#1C3F94]/80 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-transform">
							<LogIn className="w-10 h-10 text-white" />
						</div>
						<h2 className="text-4xl font-bold text-gray-900 mb-2">{t('auth.signin.title')}</h2>
						<p className="text-gray-600">
							{t('auth.signin.subtitle')}{' '}
							<Link to="/auth/signup" className="font-semibold text-[#1C3F94] hover:text-[#1C3F94]/80 transition-colors underline-offset-4 hover:underline">
								{t('navigation.register')}
							</Link>
						</p>
					</div>

					<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200/50" style={{ position: 'relative', zIndex: 1 }}>
						<form 
							onSubmit={handleSubmit} 
							className="space-y-6"
							noValidate
						>
							<div>
								<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Mail className="w-4 h-4 text-gray-500" />
										{t('auth.signin.email')}
									</div>
								</label>
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all bg-gray-50/50 hover:bg-white"
									placeholder={t('auth.signin.email')}
								/>
							</div>
							<div>
								<label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
									<div className="flex items-center gap-2">
										<Lock className="w-4 h-4 text-gray-500" />
										{t('auth.signin.password')}
									</div>
								</label>
								<div className="relative">
									<input
										id="password"
										type={showPassword ? 'text' : 'password'}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1C3F94] focus:border-[#1C3F94] transition-all pr-12 bg-gray-50/50 hover:bg-white"
										placeholder={t('auth.signin.password')}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
									>
										{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
									</button>
								</div>
							</div>
							<button
								type="submit"
								disabled={isLoading}
								style={{ 
									cursor: isLoading ? 'not-allowed' : 'pointer',
									zIndex: 10,
									position: 'relative'
								}}
								className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-[#1C3F94] to-[#1C3F94]/90 hover:from-[#1C3F94]/90 hover:to-[#1C3F94] focus:outline-none focus:ring-4 focus:ring-[#1C3F94]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
							>
								{isLoading ? (
									<>
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Signing in...
									</>
								) : (
									<>
										<LogIn className="w-5 h-5" />
										Sign In
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
