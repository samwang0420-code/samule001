#!/bin/bash
# Auto-Deploy Script for dashboard.gspr-hub.site
# Run this on the server to deploy automatically

set -e

DOMAIN="dashboard.gspr-hub.site"
DEPLOY_DIR="/opt/geo-dashboard"
REPO_DIR="/root/.openclaw/workspace-geo-arch"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     GEO Dashboard Auto-Deploy                            ║"
echo "║     Target: ${DOMAIN}                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Check environment
echo -e "${YELLOW}🔍 Checking environment...${NC}"

if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ Please run as root (sudo)${NC}"
   exit 1
fi

# Check if running from correct directory
if [ ! -d "$REPO_DIR/core-engine" ]; then
    echo -e "${RED}❌ Repository not found at $REPO_DIR${NC}"
    echo "Please run this script from the repository directory"
    exit 1
fi

echo -e "${GREEN}✅ Environment OK${NC}"

# Step 2: Install dependencies if needed
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update && apt-get install -y docker-compose
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Prepare deployment directory
echo -e "\n${YELLOW}📁 Preparing deployment directory...${NC}"

mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Copy application files
cp -r $REPO_DIR/core-engine/* .

# Create necessary directories
mkdir -p logs outputs public certbot/conf certbot/www

echo -e "${GREEN}✅ Files copied${NC}"

# Step 4: Create environment file
echo -e "\n${YELLOW}⚙️  Creating environment configuration...${NC}"

if [ ! -f ".env" ]; then
    cat > .env << EOF
# GEO Dashboard Configuration
NODE_ENV=production
API_PORT=3000
DOMAIN=${DOMAIN}
BASE_URL=https://${DOMAIN}

# Internal API Key (change this!)
API_KEYS=geo-internal-$(openssl rand -hex 16)

# Required: Apify for data scraping
APIFY_TOKEN=${APIFY_TOKEN:-}

# Required: Supabase database
SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_KEY=${SUPABASE_KEY:-}

# Optional: OpenAI for content generation
OPENAI_API_KEY=${OPENAI_API_KEY:-}

# Optional: Email notifications
EMAIL_SMTP_HOST=${EMAIL_SMTP_HOST:-}
EMAIL_SMTP_USER=${EMAIL_SMTP_USER:-}
EMAIL_SMTP_PASS=${EMAIL_SMTP_PASS:-}
FROM_EMAIL=noreply@${DOMAIN}

# Demo mode (set to false for production)
DEMO_MODE=false
EOF
    echo -e "${YELLOW}⚠️  Created .env file - please edit with your API keys!${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Step 5: SSL Certificate
echo -e "\n${YELLOW}🔒 Setting up SSL certificate...${NC}"

if [ ! -d "certbot/conf/live/${DOMAIN}" ]; then
    echo "Obtaining SSL certificate..."
    
    # Stop anything on port 80
    docker-compose down 2>/dev/null || true
    
    # Get certificate
    docker run -it --rm \
        -v "${DEPLOY_DIR}/certbot/conf:/etc/letsencrypt" \
        -v "${DEPLOY_DIR}/certbot/www:/var/www/certbot" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        -d ${DOMAIN} \
        --agree-tos \
        --non-interactive \
        --email admin@${DOMAIN} || {
            echo -e "${YELLOW}⚠️  SSL certificate generation failed or already exists${NC}"
        }
else
    echo -e "${GREEN}✅ SSL certificate exists${NC}"
fi

# Step 6: Build and start containers
echo -e "\n${YELLOW}🐳 Building and starting containers...${NC}"

docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services
sleep 5

# Step 7: Verify deployment
echo -e "\n${YELLOW}✅ Verifying deployment...${NC}"

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running${NC}"
else
    echo -e "${RED}❌ Containers failed to start${NC}"
    docker-compose logs
    exit 1
fi

# Test API
if curl -sf http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ API server responding${NC}"
else
    echo -e "${RED}❌ API server not responding${NC}"
    docker-compose logs geo-dashboard
    exit 1
fi

# Step 8: Setup auto-renewal
echo -e "\n${YELLOW}⏰ Setting up SSL auto-renewal...${NC}"

(crontab -l 2>/dev/null | grep -v "certbot renew" || true; echo "0 0 * * * cd ${DEPLOY_DIR} && docker-compose run --rm certbot renew") | crontab -

echo -e "${GREEN}✅ Auto-renewal configured${NC}"

# Step 9: Final status
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment Complete!                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🌐 Website:    https://${DOMAIN}"
echo "🔧 API:        https://${DOMAIN}/api/health"
echo "📁 Directory:  ${DEPLOY_DIR}"
echo "📊 Status:     docker-compose ps"
echo "📜 Logs:       docker-compose logs -f"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "1. Edit ${DEPLOY_DIR}/.env with your actual API keys"
echo "2. Run 'docker-compose restart' after editing .env"
echo "3. SSL certificate will auto-renew via cron"
echo ""
echo -e "${GREEN}🎉 GEO Dashboard is live!${NC}"
