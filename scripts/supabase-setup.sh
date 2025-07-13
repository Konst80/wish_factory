#!/bin/bash

# Supabase Dual-Account Management Script
# Verwaltung von Development und Production Supabase-Instanzen

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
DEV_PROJECT_ID="kgowrcgwzqfeiqitavdc"
PROD_PROJECT_ID="YOUR_PROD_PROJECT_ID" # To be updated when created

show_help() {
    cat << EOF
Supabase Dual-Account Management

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  setup-dev     Setup Development environment
  setup-prod    Setup Production environment  
  login-dev     Login to Development account
  login-prod    Login to Production account
  status        Show status of both environments
  migrate       Sync schema from Dev to Prod
  list          List all projects
  help          Show this help

Options:
  --token       Use access token for login
  --debug       Enable debug output

Examples:
  $0 setup-dev
  $0 login-prod --token YOUR_ACCESS_TOKEN
  $0 migrate
EOF
}

check_cli() {
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Install with: brew install supabase/tap/supabase"
        exit 1
    fi
    log_success "Supabase CLI version: $(supabase --version)"
}

setup_dev() {
    log_info "Setting up Development environment..."
    
    # Initialize Supabase in project if not exists
    if [ ! -f "$PROJECT_ROOT/supabase/config.toml" ]; then
        log_info "Initializing Supabase project..."
        cd "$PROJECT_ROOT"
        supabase init
    fi
    
    # Link to development project
    log_info "Linking to Development project: $DEV_PROJECT_ID"
    cd "$PROJECT_ROOT"
    supabase link --project-ref "$DEV_PROJECT_ID"
    
    log_success "Development environment linked!"
}

setup_prod() {
    log_info "Setting up Production environment..."
    
    if [ "$PROD_PROJECT_ID" = "YOUR_PROD_PROJECT_ID" ]; then
        log_warning "Production project ID not configured yet."
        log_info "Please update PROD_PROJECT_ID in this script after creating production account."
        return 1
    fi
    
    # Note: We'll handle production linking manually to avoid conflicts
    log_info "Production project ID: $PROD_PROJECT_ID"
    log_warning "Production linking should be done manually to avoid conflicts with dev environment."
    log_info "Use: supabase link --project-ref $PROD_PROJECT_ID"
}

login_dev() {
    log_info "Logging into Development account..."
    if [ -n "$TOKEN" ]; then
        supabase auth login --token "$TOKEN"
    else
        log_info "Opening browser for authentication..."
        supabase auth login
    fi
    log_success "Logged into Development account"
}

login_prod() {
    log_info "Logging into Production account..."
    log_warning "Make sure to use your PRODUCTION account credentials!"
    if [ -n "$TOKEN" ]; then
        supabase auth login --token "$TOKEN"
    else
        log_info "Opening browser for authentication..."
        supabase auth login
    fi
    log_success "Logged into Production account"
}

show_status() {
    log_info "Checking Supabase status..."
    
    echo ""
    log_info "Development Environment:"
    echo "  Project ID: $DEV_PROJECT_ID"
    echo "  URL: https://$DEV_PROJECT_ID.supabase.co"
    
    echo ""
    log_info "Production Environment:"
    if [ "$PROD_PROJECT_ID" = "YOUR_PROD_PROJECT_ID" ]; then
        echo "  Status: ❌ Not configured yet"
        echo "  Action: Create production Supabase account and update script"
    else
        echo "  Project ID: $PROD_PROJECT_ID"
        echo "  URL: https://$PROD_PROJECT_ID.supabase.co"
    fi
    
    echo ""
    log_info "Current Supabase CLI status:"
    supabase status || log_warning "No local Supabase instance running"
}

migrate_schema() {
    log_info "Migrating schema from Development to Production..."
    
    if [ "$PROD_PROJECT_ID" = "YOUR_PROD_PROJECT_ID" ]; then
        log_error "Production project not configured yet."
        return 1
    fi
    
    log_warning "This is a manual process. Steps:"
    echo "1. Export schema from Development:"
    echo "   supabase db dump --linked > dev_schema.sql"
    echo ""
    echo "2. Review and clean the schema file"
    echo ""
    echo "3. Apply to Production:"
    echo "   supabase db push --linked --project-ref $PROD_PROJECT_ID"
    echo ""
    log_info "Alternatively, use the Supabase Dashboard to copy schema manually."
}

list_projects() {
    log_info "Listing all Supabase projects..."
    supabase projects list || log_error "Failed to list projects. Make sure you're logged in."
}

# Parse command line arguments
TOKEN=""
DEBUG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --token)
            TOKEN="$2"
            shift 2
            ;;
        --debug)
            DEBUG="1"
            set -x
            shift
            ;;
        setup-dev)
            COMMAND="setup-dev"
            shift
            ;;
        setup-prod)
            COMMAND="setup-prod"
            shift
            ;;
        login-dev)
            COMMAND="login-dev"
            shift
            ;;
        login-prod)
            COMMAND="login-prod"
            shift
            ;;
        status)
            COMMAND="status"
            shift
            ;;
        migrate)
            COMMAND="migrate"
            shift
            ;;
        list)
            COMMAND="list"
            shift
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
check_cli

case "${COMMAND:-}" in
    "setup-dev")
        setup_dev
        ;;
    "setup-prod")
        setup_prod
        ;;
    "login-dev")
        login_dev
        ;;
    "login-prod")
        login_prod
        ;;
    "status")
        show_status
        ;;
    "migrate")
        migrate_schema
        ;;
    "list")
        list_projects
        ;;
    "")
        log_info "Supabase Dual-Account Manager"
        echo ""
        show_status
        echo ""
        log_info "Use '$0 help' for available commands"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac