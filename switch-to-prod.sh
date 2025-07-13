#!/bin/bash
echo "🔄 Switching to Production environment..."
cp .env.production .env
echo "✅ Now connected to Production DB (bnbzkfwowcqnecrdqdas)"
echo "🚀 Run 'npm run dev' to start with Production DB"