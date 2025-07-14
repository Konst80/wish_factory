#!/bin/bash
echo "🔄 Switching to Development environment..."

# Switch environment file
cp .env.development .env
echo "✅ Environment file switched to Development DB (kgowrcgwzqfeiqitavdc)"

# Kill any running dev server
echo "🛑 Stopping any running dev server..."
pkill -f "vite dev" || true
pkill -f "npm run dev" || true
sleep 2

# Clear cache
echo "🧹 Clearing SvelteKit cache..."
rm -rf node_modules/.vite .svelte-kit/generated

# Start dev server with proper environment loading
echo "🚀 Starting dev server with Development environment..."
echo "📍 Server will be available at http://localhost:5173"
echo "⚠️  If port 5173 is busy, check the terminal output for the actual port"

# Load environment variables and start server
set -a
source .env
set +a
npm run dev