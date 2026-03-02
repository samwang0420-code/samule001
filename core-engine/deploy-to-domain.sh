#!/bin/bash
# Deploy GEO Dashboard to dashboard.gspr-hub.site
# 
# Usage: ./deploy-to-domain.sh [domain]
# Default domain: dashboard.gspr-hub.site

set -e

DOMAIN="${1:-dashboard.gspr-hub.site}"
echo "Deploying to: $DOMAIN"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting deployment to ${DOMAIN}...${NC}"

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    pip3 install docker-compose
fi

# Create deployment directory
DEPLOY_DIR="/opt/geo-dashboard"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Copy files
echo -e "${YELLOW}📁 Copying application files...${NC}"
cp -r /root/.openclaw/workspace-geo-arch/core-engine/* .

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env file...${NC}"
    cat > .env <> EOF
NODE_ENV=production
API_PORT=3000
DOMAIN=${DOMAIN}
API_KEYS=geo-api-key-$(openssl rand -hex 16)
DEMO_MODE=false
EOF
    echo "⚠️  Please edit .env with your API keys before starting!"
fi

# Get SSL certificate
echo -e "${YELLOW}🔒 Obtaining SSL certificate...${NC}"
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
    --email admin@${DOMAIN} || echo "Certificate may already exist"

# Start services
echo -e "${YELLOW}🐳 Starting Docker containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for services
sleep 5

# Check status
echo -e "${YELLOW}✅ Checking deployment status...${NC}"
if curl -sf http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${YELLOW}⚠️  API server may still be starting...${NC}"
fi

# Setup cron for SSL renewal
echo -e "${YELLOW}⏰ Setting up SSL auto-renewal...${NC}"
(crontab -l 2>/dev/null || true; echo "0 0 * * * cd ${DEPLOY_DIR} && docker-compose run --rm certbot renew") | crontab -

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment Complete!                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "🌐 Dashboard: https://${DOMAIN}"
echo "📖 API Docs:  https://${DOMAIN}/api/health"
echo "🔧 Status:    docker-compose ps"
echo "📊 Logs:      docker-compose logs -f"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "1. Edit ${DEPLOY_DIR}/.env with your API keys"
echo "2. Restart: docker-compose restart"
echo "3. SSL auto-renews via cron"
echo ""
echo -e "${GREEN}🎉 GEO Dashboard is live at https://${DOMAIN}!${NC}"
