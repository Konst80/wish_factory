#!/bin/bash

echo "🚀 Setting up Railway environment variables..."

# Lade die aktuellen .env Werte
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Setze Railway Environment Variables
echo "📝 Setting Supabase configuration..."
railway variables set PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL}"
railway variables set PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_ANON_KEY}"
railway variables set SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

echo "🤖 Setting AI configuration..."
railway variables set OPENAI_API_KEY="${OPENAI_API_KEY}"

echo "🔐 Setting admin configuration..."
railway variables set ADMIN_SETUP_PASSWORD="${ADMIN_SETUP_PASSWORD}"

echo "⚙️ Setting Railway-specific variables..."
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set BODY_SIZE_LIMIT="10485760"

echo "✅ Environment variables set successfully!"
echo "🌐 Next step: Get your Railway URL and update ORIGIN variable"
echo "   Run: railway domain"
echo "   Then: railway variables set ORIGIN=https://your-railway-url.railway.app"