import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { loadavg, freemem, totalmem } from 'os';

export const load: PageServerLoad = async ({ locals, parent }) => {
	// Get user data from parent layout (dashboard layout handles authentication)
	const { user } = await parent();

	// If we reach here, user is already authenticated by dashboard layout
	// Allow all authenticated users to access system information
	// (In production, you might want to restrict this to admin users only)

	// Get system information
	const systemInfo = {
		// Application Info
		application: {
			name: 'Wish Factory',
			version: '1.0.0',
			environment: process.env.NODE_ENV || 'development',
			buildDate: new Date().toISOString(),
			uptime: process.uptime()
		},

		// Runtime Info
		runtime: {
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
			pid: process.pid,
			memory: process.memoryUsage()
		},

		// Environment Variables (filtered for security)
		environment: {
			NODE_ENV: process.env.NODE_ENV,
			PORT: process.env.PORT,
			DATABASE_URL: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]',
			OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[CONFIGURED]' : '[NOT CONFIGURED]',
			SMTP_HOST: process.env.SMTP_HOST || '[NOT CONFIGURED]',
			SMTP_PORT: process.env.SMTP_PORT || '[NOT CONFIGURED]',
			SMTP_USER: process.env.SMTP_USER ? '[CONFIGURED]' : '[NOT CONFIGURED]',
			SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '[CONFIGURED]' : '[NOT CONFIGURED]'
		},

		// Services Status
		services: {
			database: {
				status: 'online',
				lastChecked: new Date().toISOString(),
				responseTime: Math.floor(Math.random() * 50) + 10 // Simulated
			},
			aiService: {
				status: process.env.OPENAI_API_KEY ? 'online' : 'offline',
				lastChecked: new Date().toISOString(),
				responseTime: Math.floor(Math.random() * 200) + 50 // Simulated
			},
			emailService: {
				status: process.env.SMTP_HOST && process.env.SMTP_USER ? 'online' : 'offline',
				lastChecked: new Date().toISOString(),
				responseTime: Math.floor(Math.random() * 100) + 20 // Simulated
			}
		},

		// Performance Metrics
		performance: {
			cpuUsage: process.cpuUsage(),
			loadAverage: process.platform === 'win32' ? null : loadavg(),
			freeMemory: freemem(),
			totalMemory: totalmem()
		},

		// Request Info
		request: {
			userAgent: 'System Dashboard',
			timestamp: new Date().toISOString(),
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
		}
	};

	return {
		systemInfo
	};
};
