import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
	try {
		const token = req.headers.authorization?.replace('Bearer ', '')
		
		if (!token) {
			return res.status(401).json({ message: 'No token provided' })
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
		const user = await User.findById(decoded.userId).select('-password')
		
		if (!user || !user.isActive) {
			return res.status(401).json({ message: 'User not found or inactive' })
		}

		req.user = user
		next()
	} catch (error) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}

export const requireRole = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' })
		}
		
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ message: 'Forbidden' })
		}
		
		next()
	}
}
