/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [daisyui],
	daisyui: {
		themes: [
			'light',
			'dark',
			'corporate',
			{
				'wish-factory': {
					primary: '#3b82f6',
					secondary: '#64748b',
					accent: '#f59e0b',
					neutral: '#374151',
					'base-100': '#ffffff',
					info: '#06b6d4',
					success: '#10b981',
					warning: '#f59e0b',
					error: '#ef4444'
				}
			}
		],
		darkTheme: 'dark',
		base: true,
		styled: true,
		utils: true,
		prefix: '',
		logs: true,
		themeRoot: ':root'
	}
};
