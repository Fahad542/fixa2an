import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { CheckCircle, Shield, Clock, Star, ArrowRight, Building2, Timer, Heart, Award, Camera, Receipt, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { HeroCarousel } from '../components/HeroCarousel'

export default function HomePage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const [parallaxOffset, setParallaxOffset] = useState(0)
	const [ctaSectionTop, setCtaSectionTop] = useState(0)

	// Redirect authenticated users to their respective dashboards
	// Commented out to allow homepage to be visible even when logged in
	// Uncomment if you want automatic redirect for logged-in users
	/*
	useEffect(() => {
		if (authLoading) return
		
		if (user) {
			const role = user.role?.toUpperCase()
			
			// Small delay to allow page to render first
			const timer = setTimeout(() => {
			if (role === 'ADMIN') {
				navigate('/admin', { replace: true })
			} else if (role === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
			} else if (role === 'CUSTOMER' || user.role) {
				navigate('/my-cases', { replace: true })
			}
			}, 100)
			
			return () => clearTimeout(timer)
		}
	}, [user, authLoading, navigate])
	*/

	// Store CTA section position on mount and resize
	useEffect(() => {
		const updateCtaPosition = () => {
			const ctaSection = document.getElementById('cta-section')
			if (ctaSection) {
				const rect = ctaSection.getBoundingClientRect()
				setCtaSectionTop(rect.top + window.scrollY)
			}
		}
		
		updateCtaPosition()
		window.addEventListener('resize', updateCtaPosition)
		return () => window.removeEventListener('resize', updateCtaPosition)
	}, [])

	useEffect(() => {
		let ticking = false
		
		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					const currentScrollY = window.scrollY
					const ctaSection = document.getElementById('cta-section')
					
					// Calculate parallax offset for CTA section
					if (ctaSection && ctaSectionTop > 0) {
						const rect = ctaSection.getBoundingClientRect()
						const viewportHeight = window.innerHeight
						const sectionStart = ctaSectionTop - viewportHeight
						
						// Calculate parallax when section is in viewport
						if (currentScrollY >= sectionStart && rect.bottom > 0) {
							const scrollProgress = currentScrollY - sectionStart
							const offset = Math.max(-100, Math.min(100, -scrollProgress * 0.3))
							setParallaxOffset(offset)
						} else if (currentScrollY < sectionStart) {
							setParallaxOffset(0)
						} else {
							setParallaxOffset(-100)
						}
					}
					
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		
		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [ctaSectionTop])

	// Show loading state while checking auth
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen">
			<Navbar />

			{/* Hero Section with Carousel */}
			<section className="relative w-full overflow-hidden" style={{ marginTop: 0, paddingTop: 0 }}>
				{/* Carousel Background */}
				<div className="absolute inset-0 w-full" style={{ top: 0 }}>
					<HeroCarousel />
				</div>

				{/* Content Overlay */}
				<div className="relative z-10 flex items-center justify-center min-h-screen py-12 sm:py-16 md:py-20 lg:py-28 pt-20 sm:pt-24 md:pt-28">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
						<div className="text-center">
							<h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight animate-fade-in-up text-white drop-shadow-2xl px-2">
								{t('homepage.title')}
							</h1>
							<p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto leading-relaxed font-medium animate-fade-in-up text-white drop-shadow-lg px-2">
								{t('homepage.subtitle')}
							</p>
							<div className="flex flex-row gap-3 sm:gap-4 md:gap-5 justify-center items-center mb-8 sm:mb-10 md:mb-12 animate-fade-in-up px-2">
								<Link to="/upload">
									<Button 
										size="lg" 
										className="text-sm sm:text-base px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-5 md:py-6 h-auto shadow-2xl hover:shadow-[0_20px_50px_rgba(28,63,148,0.4)] hover:scale-105 sm:hover:scale-110 transition-all duration-300 font-semibold rounded-xl group relative overflow-hidden whitespace-nowrap" 
										style={{ backgroundColor: '#1C3F94', color: '#FFFFFF' }}
									>
										<span className="relative z-10 flex items-center justify-center">
											{t('homepage.cta_primary')}
										</span>
										<span className="absolute inset-0 bg-gradient-to-r from-[#1C3F94] to-[#2a5bb8] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
									</Button>
								</Link>
								<Button 
									variant="outline" 
									size="lg" 
									className="text-sm sm:text-base px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-5 md:py-6 h-auto border-2 hover:bg-white hover:text-[#1C3F94] hover:scale-105 sm:hover:scale-110 transition-all duration-300 font-semibold bg-white/10 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl group whitespace-nowrap" 
									style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}
									onClick={() => {
										const howItWorksSection = document.getElementById('how-it-works-section')
										if (howItWorksSection) {
											howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
										}
									}}
								>
									{t('homepage.cta_secondary')}
								</Button>
							</div>

							{/* Stats */}
							<div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 max-w-5xl mx-auto px-2">
								<div className="text-center p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md border border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 sm:hover:-translate-y-2 group shadow-xl hover:shadow-2xl">
									<div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg" style={{ backgroundColor: '#1C3F94' }}>
										<Building2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
									</div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 text-white drop-shadow-lg">500+</div>
									<div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/95 uppercase tracking-wide leading-tight">Verified Workshops</div>
								</div>
								<div className="text-center p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md border border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 sm:hover:-translate-y-2 group shadow-xl hover:shadow-2xl">
									<div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg" style={{ backgroundColor: '#1C3F94' }}>
										<Timer className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
									</div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 text-white drop-shadow-lg">24h</div>
									<div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/95 uppercase tracking-wide leading-tight">Average Response</div>
								</div>
								<div className="text-center p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md border border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 sm:hover:-translate-y-2 group shadow-xl hover:shadow-2xl">
									<div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg" style={{ backgroundColor: '#34C759' }}>
										<Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
									</div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 text-white drop-shadow-lg">10k+</div>
									<div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/95 uppercase tracking-wide leading-tight">Happy Customers</div>
								</div>
								<div className="text-center p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md border border-white/40 hover:bg-white/25 hover:border-white/60 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:-translate-y-1 sm:hover:-translate-y-2 group shadow-xl hover:shadow-2xl">
									<div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg" style={{ backgroundColor: '#34C759' }}>
										<Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
									</div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-2 text-white drop-shadow-lg">4.8★</div>
									<div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/95 uppercase tracking-wide leading-tight">Average Rating</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section id="how-it-works-section" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
				{/* Enhanced Background decoration */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 animate-pulse hidden md:block" style={{ backgroundColor: '#1C3F94', filter: 'blur(80px)' }}></div>
					<div className="absolute bottom-20 right-10 w-72 h-72 rounded-full opacity-10 animate-pulse delay-1000 hidden md:block" style={{ backgroundColor: '#34C759', filter: 'blur(80px)' }}></div>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 hidden md:block" style={{ backgroundColor: '#1C3F94', filter: 'blur(120px)' }}></div>
				</div>
				
				<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
					<div className="text-center mb-10 sm:mb-14 md:mb-20">
						<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-[#1C3F94] via-[#2a5bb8] to-[#34C759] bg-clip-text text-transparent leading-tight px-2">
							{t('homepage.how_it_works.title')}
						</h2>
						<p className="text-xs sm:text-sm md:text-base max-w-3xl mx-auto leading-relaxed text-black font-medium px-2">
							{t('homepage.how_it_works.subtitle')}
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 relative">
						{/* Step 1 */}
						<div className="relative group">
							<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
								<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl font-bold text-white text-sm sm:text-base relative group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: '#1C3F94' }}>
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
									<span className="relative z-10">1</span>
								</div>
							</div>
							
							<Card className="pt-10 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 h-full border-2 border-gray-200 hover:border-[#1C3F94] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(28,63,148,0.15)] hover:-translate-y-3 bg-white group-hover:bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl sm:rounded-3xl relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
								
								<div className="flex flex-col items-center text-center relative z-10 h-full">
									<div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative" style={{ backgroundColor: '#1C3F94' }}>
										<div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/30 to-transparent"></div>
										<Camera className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
									</div>
									<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-[#1C3F94] transition-colors duration-300">
										{t('homepage.how_it_works.step1.title')}
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-600 font-normal mb-0">
										{t('homepage.how_it_works.step1.description')}
									</CardDescription>
								</div>
							</Card>
							
							<div className="hidden md:block absolute top-1/2 -right-5 lg:-right-10 z-10 group-hover:translate-x-2 transition-transform duration-300">
								<div className="relative">
									<ArrowRight className="w-10 h-10 text-[#1C3F94]/40 group-hover:text-[#1C3F94] transition-colors duration-300" />
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1C3F94]/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
							</div>
						</div>

						{/* Step 2 */}
						<div className="relative group">
							<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
								<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl font-bold text-white text-sm sm:text-base relative group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: '#1C3F94' }}>
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
									<span className="relative z-10">2</span>
								</div>
							</div>
							
							<Card className="pt-10 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 h-full border-2 border-gray-200 hover:border-[#1C3F94] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(28,63,148,0.15)] hover:-translate-y-3 bg-white group-hover:bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl sm:rounded-3xl relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-br from-[#1C3F94]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
								
								<div className="flex flex-col items-center text-center relative z-10 h-full">
									<div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative" style={{ backgroundColor: '#1C3F94' }}>
										<div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/30 to-transparent"></div>
										<Receipt className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
									</div>
									<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-[#1C3F94] transition-colors duration-300">
										{t('homepage.how_it_works.step2.title')}
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-600 font-normal mb-0">
										{t('homepage.how_it_works.step2.description')}
									</CardDescription>
								</div>
							</Card>
							
							<div className="hidden md:block absolute top-1/2 -right-5 lg:-right-10 z-10 group-hover:translate-x-2 transition-transform duration-300">
								<div className="relative">
									<ArrowRight className="w-10 h-10 text-[#34C759]/40 group-hover:text-[#34C759] transition-colors duration-300" />
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#34C759]/20 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
							</div>
						</div>

						{/* Step 3 */}
						<div className="relative group">
							<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
								<div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-xl font-bold text-white text-sm sm:text-base relative group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: '#34C759' }}>
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
									<span className="relative z-10">3</span>
								</div>
							</div>
							
							<Card className="pt-10 sm:pt-12 pb-6 sm:pb-8 px-4 sm:px-6 h-full border-2 border-gray-200 hover:border-[#34C759] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(52,199,89,0.15)] hover:-translate-y-3 bg-white group-hover:bg-gradient-to-br from-white via-green-50/30 to-white rounded-2xl sm:rounded-3xl relative overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-br from-[#34C759]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl"></div>
								
								<div className="flex flex-col items-center text-center relative z-10 h-full">
									<div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative" style={{ backgroundColor: '#34C759' }}>
										<div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/30 to-transparent"></div>
										<Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
									</div>
									<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-[#34C759] transition-colors duration-300">
										{t('homepage.how_it_works.step3.title')}
									</CardTitle>
									<CardDescription className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-600 font-normal mb-0">
										{t('homepage.how_it_works.step3.description')}
									</CardDescription>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="py-12 sm:py-16 md:py-20 lg:py-28 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-0 left-0 w-1/3 h-full" style={{ background: 'linear-gradient(to right, rgba(28, 63, 148, 0.02), transparent)' }}></div>
					<div className="absolute top-0 right-0 w-1/3 h-full" style={{ background: 'linear-gradient(to left, rgba(52, 199, 89, 0.02), transparent)' }}></div>
				</div>
				<div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
					<div className="text-center mb-8 sm:mb-10 md:mb-12">
						<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 leading-tight px-2" style={{ color: '#333333' }}>
							{t('homepage.features.title')}
						</h2>
						<p className="text-xs sm:text-sm md:text-base max-w-3xl mx-auto leading-relaxed px-2" style={{ color: '#666666' }}>
							{t('homepage.features.subtitle')}
						</p>
					</div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8 lg:gap-10">
						<Card className="text-center border-0 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 bg-white group relative overflow-hidden" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
							<div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: '#34C759' }}></div>
							<CardHeader className="pb-3 pt-4 sm:pt-6 relative z-10 px-4 sm:px-6">
								<div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#34C759' }}>
									<Shield className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" />
								</div>
								<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#333333' }}>
									{t('homepage.features.verified.title')}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
								<p className="leading-relaxed text-xs sm:text-sm md:text-base" style={{ color: '#666666', lineHeight: '1.8' }}>{t('homepage.features.verified.description')}</p>
							</CardContent>
						</Card>

						<Card className="text-center border-0 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 bg-white group relative overflow-hidden" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
							<div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: '#1C3F94' }}></div>
							<CardHeader className="pb-3 pt-4 sm:pt-6 relative z-10 px-4 sm:px-6">
								<div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#1C3F94' }}>
									<Clock className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" />
								</div>
								<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#333333' }}>{t('homepage.features.fast.title')}</CardTitle>
							</CardHeader>
							<CardContent className="pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
								<p className="leading-relaxed text-xs sm:text-sm md:text-base" style={{ color: '#666666', lineHeight: '1.8' }}>{t('homepage.features.fast.description')}</p>
							</CardContent>
						</Card>

						<Card className="text-center border-0 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 bg-white group relative overflow-hidden" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
							<div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: '#1C3F94' }}></div>
							<CardHeader className="pb-3 pt-4 sm:pt-6 relative z-10 px-4 sm:px-6">
								<div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#1C3F94' }}>
									<Star className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" />
								</div>
								<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#333333' }}>
									{t('homepage.features.transparent.title')}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
								<p className="leading-relaxed text-xs sm:text-sm md:text-base" style={{ color: '#666666', lineHeight: '1.8' }}>{t('homepage.features.transparent.description')}</p>
							</CardContent>
						</Card>

						<Card className="text-center border-0 hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 bg-white group relative overflow-hidden" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: '16px' }}>
							<div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundColor: '#34C759' }}></div>
							<CardHeader className="pb-3 pt-4 sm:pt-6 relative z-10 px-4 sm:px-6">
								<div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300" style={{ backgroundColor: '#34C759' }}>
									<CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-white" />
								</div>
								<CardTitle className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3" style={{ color: '#333333' }}>{t('homepage.features.secure.title')}</CardTitle>
							</CardHeader>
							<CardContent className="pb-4 sm:pb-6 px-4 sm:px-6 relative z-10">
								<p className="leading-relaxed text-xs sm:text-sm md:text-base" style={{ color: '#666666', lineHeight: '1.8' }}>{t('homepage.features.secure.description')}</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section with Parallax Background */}
			<section 
				id="cta-section" 
				className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden" 
				style={{ minHeight: '400px' }}
			>
				<div 
					className="absolute"
					style={{
						backgroundImage: 'url(/assets/hero2.jpeg)',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat',
						transform: `translateY(${parallaxOffset}px)`,
						willChange: 'transform',
						top: '-100px',
						left: 0,
						right: 0,
						width: '100%',
						height: 'calc(100% + 200px)',
						minHeight: 'calc(100% + 200px)'
					}}
				/>
				<div 
					className="absolute inset-0 w-full h-full"
					style={{
						backgroundColor: '#000000',
						opacity: 0.75
					}}
				/>
				<div className="absolute inset-0 opacity-30">
					<div className="absolute top-0 right-0 w-96 h-96 rounded-full hidden md:block" style={{ backgroundColor: '#34C759', filter: 'blur(100px)' }}></div>
					<div className="absolute bottom-0 left-0 w-96 h-96 rounded-full hidden md:block" style={{ backgroundColor: '#FFFFFF', filter: 'blur(100px)' }}></div>
				</div>
				<div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center relative z-10">
					<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 text-white leading-tight drop-shadow-lg px-2 text-center">{t('homepage.cta.title')}</h2>
					<p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white/90 leading-relaxed drop-shadow-md px-2 text-center">{t('homepage.cta.subtitle')}</p>
					<div className="flex justify-center">
						<Link to="/upload">
							<Button size="lg" variant="secondary" className="text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-5 h-auto shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 bg-white hover:bg-gray-50 font-semibold" style={{ color: '#1C3F94' }}>
								{t('homepage.cta.button')}
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white py-12 sm:py-16 md:py-20 overflow-hidden">
				<div className="absolute inset-0 opacity-5">
					<div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#1C3F94' }}></div>
					<div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: '#34C759' }}></div>
				</div>
				
				<div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-10 sm:mb-12 md:mb-16">
						<div className="sm:col-span-2 md:col-span-1">
							<h3 className="text-2xl sm:text-3xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
								Fixa2an
							</h3>
							<p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4 max-w-xs">
								{t('footer.brand_tagline')}
							</p>
							<div className="h-1 w-16 bg-gradient-to-r from-[#1C3F94] to-[#34C759] rounded-full"></div>
						</div>
						
						<div>
							<h4 className="font-bold mb-5 sm:mb-6 text-base sm:text-lg text-white relative pb-2">
								{t('footer.for_customers')}
								<span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-[#1C3F94] to-transparent rounded-full"></span>
							</h4>
							<ul className="space-y-3 sm:space-y-4">
								<li>
									<button 
										onClick={() => {
											const howItWorksSection = document.getElementById('how-it-works-section')
											if (howItWorksSection) {
												howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
											}
										}}
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#1C3F94] transition-colors">{t('footer.how_it_works')}</span>
									</button>
								</li>
								<li>
									<Link 
										to="/faq" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#1C3F94] transition-colors">{t('footer.faq')}</span>
									</Link>
								</li>
								<li>
									<Link 
										to="/contact" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#1C3F94] transition-colors">{t('footer.contact')}</span>
									</Link>
								</li>
							</ul>
						</div>
						
						<div>
							<h4 className="font-bold mb-5 sm:mb-6 text-base sm:text-lg text-white relative pb-2">
								{t('footer.for_workshops')}
								<span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-[#34C759] to-transparent rounded-full"></span>
							</h4>
							<ul className="space-y-3 sm:space-y-4">
								<li>
									<Link 
										to="/workshop/signup" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#34C759] transition-colors">{t('footer.register_workshop')}</span>
									</Link>
								</li>
								<li>
									<Link 
										to="/workshop/benefits" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#34C759] transition-colors">{t('footer.benefits')}</span>
									</Link>
								</li>
								<li>
									<Link 
										to="/workshop/contact" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-[#34C759] transition-colors">{t('footer.contact')}</span>
									</Link>
								</li>
							</ul>
						</div>
						
						<div>
							<h4 className="font-bold mb-5 sm:mb-6 text-base sm:text-lg text-white relative pb-2">
								{t('footer.legal')}
								<span className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-gray-500 to-transparent rounded-full"></span>
							</h4>
							<ul className="space-y-3 sm:space-y-4">
								<li>
									<Link 
										to="/terms" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-gray-200 transition-colors">{t('footer.terms')}</span>
									</Link>
								</li>
								<li>
									<Link 
										to="/privacy" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-gray-200 transition-colors">{t('footer.privacy')}</span>
									</Link>
								</li>
								<li>
									<Link 
										to="/cookies" 
										className="text-sm sm:text-base text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-1 inline-block group"
									>
										<span className="group-hover:text-gray-200 transition-colors">{t('footer.cookies')}</span>
									</Link>
								</li>
							</ul>
						</div>
					</div>
					
					<div className="border-t border-gray-800/50 pt-6 sm:pt-8">
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
							<p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
								{t('footer.copyright')}
							</p>
							<div className="flex items-center gap-2 text-gray-500">
								<div className="h-1 w-1 rounded-full bg-[#1C3F94]"></div>
								<div className="h-1 w-1 rounded-full bg-[#34C759]"></div>
								<div className="h-1 w-1 rounded-full bg-gray-500"></div>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
