#!/bin/bash

# Production Environment Setup Helper
# Updates .env.production with the missing service role key

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Production Environment Setup${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.production"

echo -e "${BLUE}Current Production Configuration:${NC}"
echo "Project ID: bnbzkfwowcqnecrdqdas"
echo "URL: https://bnbzkfwowcqnecrdqdas.supabase.co"
echo "Anon Key: ✅ Configured"
echo "Service Role Key: ❌ Missing"
echo ""

echo -e "${YELLOW}To complete setup:${NC}"
echo "1. Go to: https://bnbzkfwowcqnecrdqdas.supabase.co"
echo "2. Navigate to: Settings → API"
echo "3. Copy the 'service_role' key"
echo "4. Paste it below:"
echo ""

read -p "Enter Production Service Role Key: " SERVICE_ROLE_KEY

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ No key provided. Exiting."
    exit 1
fi

# Update .env.production file
sed -i '' "s/SUPABASE_SERVICE_ROLE_KEY=YOUR_PRODUCTION_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY/" "$ENV_FILE"

echo ""
echo -e "${GREEN}✅ Production environment updated successfully!${NC}"
echo ""

echo -e "${BLUE}Verification:${NC}"
grep "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" | sed 's/.*=\(eyJ[^.]*\).*/Service Role Key: \1.../'

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Test connection: npm run supabase:status"
echo "2. Login to production: npm run supabase:prod"
echo "3. Setup GitHub Secrets for automated deployment"