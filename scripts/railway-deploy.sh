#!/bin/bash

echo "🚀 Starting Railway deployment..."

# Check if logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

# Check if project is linked
if ! railway status > /dev/null 2>&1; then
    echo "❌ No Railway project linked. Please run: railway init --name wish-factory"
    exit 1
fi

# Test build locally first
echo "🔍 Testing build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed! Fix errors before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Check if using Docker or Nixpacks
if [ -f "Dockerfile" ]; then
    echo "🐳 Using Docker for deployment"
elif [ -f "nixpacks.toml" ]; then
    echo "📦 Using Nixpacks for deployment"
else
    echo "⚠️ No Dockerfile or nixpacks.toml found, using Railway auto-detection"
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Getting your app URL..."
    railway domain
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update ORIGIN variable: railway variables set ORIGIN=https://your-url.railway.app"
    echo "   2. Test similarity calculations at: /dashboard/wishes/similarity"
    echo "   3. Monitor logs: railway logs"
    echo "   4. Check status: railway status"
else
    echo "❌ Deployment failed!"
    echo "🔍 Check logs: railway logs"
    exit 1
fi