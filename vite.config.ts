import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		'process.env.NODE_ENV': mode === 'production' ? '"production"' : '"development"'
	}
}));
