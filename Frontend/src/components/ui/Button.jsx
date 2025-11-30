import React from 'react'
import { cn } from '../../utils/cn'

const buttonVariants = {
	default: 'bg-blue-600 text-white hover:bg-blue-700',
	destructive: 'bg-red-600 text-white hover:bg-red-700',
	outline: 'border border-gray-300 bg-white hover:bg-gray-50',
	secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
	ghost: 'hover:bg-gray-100',
	link: 'text-blue-600 underline-offset-4 hover:underline',
	success: 'bg-green-600 text-white hover:bg-green-700',
}

const buttonSizes = {
	default: 'h-10 px-4 py-2',
	sm: 'h-9 px-3 rounded-md',
	lg: 'h-11 px-8 rounded-md',
	icon: 'h-10 w-10',
}

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
	const baseClasses =
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
	const variantClass = buttonVariants[variant] || buttonVariants.default
	const sizeClass = buttonSizes[size] || buttonSizes.default

	return (
		<button ref={ref} className={cn(baseClasses, variantClass, sizeClass, className)} {...props} />
	)
})
Button.displayName = 'Button'
