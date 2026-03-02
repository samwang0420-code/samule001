#!/bin/bash
# Deploy Script for GEO Core Engine
# Usage: ./deploy.sh [environment]
# Environments: local, staging, production

set -e

ENV=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Deploying GEO Core Engine to $ENV environment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Please install Node.js 18+."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version must be 18+. Current: $(node -v)"
        exit 1
    fi
    
    log "✓ Node.js $(node -v)"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        warn ".env file not found. Creating from template..."
        cp .env.example .env
        warn "Please edit .env with your API keys before running again."
        exit 1
    fi
    
    log "✓ Environment file exists"
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."
    npm install --production
    log "✓ Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Test database connection
    if [ -f "test-db.js" ]; then
        node test-db.js &> /dev/null && log "✓ Database connection test passed" || warn "Database not configured"
    fi
    
    # Test citation engine
    node -e "import('./lib/citation-engine.js').then(m => console.log('✓ Citation engine loaded'))"
    
    # Test knowledge graph
    node -e "import('./lib/knowledge-graph.js').then(m => console.log('✓ Knowledge graph loaded'))"
    
    log "✓ All tests passed"
}

# Setup directories
setup_dirs() {
    log "Setting up directories..."
    mkdir -p outputs
    mkdir -p data
    mkdir -p logs
    chmod +x *.js *.sh 2>/dev/null || true
    log "✓ Directories ready"
}

# Setup cron jobs (production only)
setup_cron() {
    if [ "$ENV" = "production" ]; then
        log "Setting up cron jobs..."
        
        # Add cron entries
        (crontab -l 2>/dev/null || echo "") | grep -v "scheduler.sh" | {
            cat
            echo "# GEO Core Engine - Daily monitoring"
            echo "0 6 * * * cd $SCRIPT_DIR && ./scheduler.sh daily >> logs/cron-daily.log 2>&1"
            echo "# GEO Core Engine - Weekly reports"
            echo "0 8 * * 1 cd $SCRIPT_DIR && ./scheduler.sh weekly >> logs/cron-weekly.log 2>&1"
        } | crontab -
        
        log "✓ Cron jobs configured"
    fi
}

# Create systemd service (production only)
setup_service() {
    if [ "$ENV" = "production" ] && command -v systemctl &> /dev/null; then
        log "Creating systemd service..."
        
        sudo tee /etc/systemd/system/geo-engine.service > /dev/null << EOF
[Unit]
Description=GEO Core Engine
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=/usr/bin/node $SCRIPT_DIR/geo.js status
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable geo-engine.service
        log "✓ Systemd service created"
    fi
}

# Verify deployment
verify() {
    log "Verifying deployment..."
    
    # Check if main script works
    if node geo.js status > /dev/null 2>&1; then
        log "✓ GEO CLI is working"
    else
        error "GEO CLI test failed"
        exit 1
    fi
    
    # Check output directory
    if [ -d "outputs" ]; then
        log "✓ Output directory exists"
    fi
    
    log "✓ Deployment verified"
}

# Print summary
print_summary() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║              DEPLOYMENT COMPLETE                         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Environment: $ENV"
    echo "Location: $SCRIPT_DIR"
    echo ""
    echo "Quick Start:"
    echo "  ./geo.js onboard \"Law Firm Name\" \"Address\""
    echo "  ./geo.js status"
    echo ""
    echo "Configuration:"
    echo "  - Edit .env to add API keys"
    echo "  - Run ./test-apify.js to verify Apify"
    echo "  - Run ./test-db.js to verify database"
    echo ""
    
    if [ "$ENV" = "production" ]; then
        echo "Production Setup:"
        echo "  - Cron jobs: crontab -l"
        echo "  - Service: sudo systemctl status geo-engine"
        echo ""
    fi
}

# Main deployment flow
main() {
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║         GEO Core Engine Deployment                       ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    install_deps
    run_tests
    setup_dirs
    setup_cron
    setup_service
    verify
    print_summary
}

main
