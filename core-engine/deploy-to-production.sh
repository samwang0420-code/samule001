#!/bin/bash
# Deploy GEO Platform to dashboard.gspr-hub.site
# 
# Run this on the server hosting gspr-hub.site

set -e

DOMAIN="dashboard.gspr-hub.site"
INSTALL_DIR="/var/www/geo-dashboard"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Deploying GEO Platform to ${DOMAIN}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ Please run as root (sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}📋 Step 1: Installing Dependencies${NC}"

# Update system
apt-get update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

# Install certbot for SSL
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "\n${YELLOW}📁 Step 2: Setting up Application${NC}"

# Create directory
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Copy application files (assumes running from git repo)
if [ -d "/root/.openclaw/workspace-geo-arch/core-engine" ]; then
    cp -r /root/.openclaw/workspace-geo-arch/core-engine/* $INSTALL_DIR/
else
    echo -e "${YELLOW}⚠️  Please copy core-engine files to ${INSTALL_DIR}${NC}"
    exit 1
fi

# Install dependencies
cd $INSTALL_DIR
npm install --production

echo -e "${GREEN}✅ Application files installed${NC}"

echo -e "\n${YELLOW}⚙️  Step 3: Configuring Environment${NC}"

# Create .env file
cat > $INSTALL_DIR/.env << EOF
# GEO Platform Configuration
NODE_ENV=production
API_PORT=3000

# Domain
DOMAIN=${DOMAIN}
BASE_URL=https://${DOMAIN}

# Required APIs
APIFY_TOKEN=${APIFY_TOKEN:-your_apify_token}
SUPABASE_URL=${SUPABASE_URL:-your_supabase_url}
SUPABASE_KEY=${SUPABASE_KEY:-your_supabase_key}

# Optional - AI Content
OPENAI_API_KEY=${OPENAI_API_KEY:-}

# Optional - Perplexity Scraping
BRIGHTDATA_API_TOKEN=${BRIGHTDATA_API_TOKEN:-}

# Optional - Email
EMAIL_SMTP_HOST=${EMAIL_SMTP_HOST:-}
EMAIL_SMTP_USER=${EMAIL_SMTP_USER:-}
EMAIL_SMTP_PASS=${EMAIL_SMTP_PASS:-}
FROM_EMAIL=noreply@${DOMAIN}
FROM_NAME="GEO Dashboard"

# API Keys for clients
API_KEYS=${API_KEYS:-geo-api-key-$(openssl rand -hex 16)}

# Demo Mode (set to false for production)
DEMO_MODE=false
EOF

echo -e "${GREEN}✅ Environment configured${NC}"

echo -e "\n${YELLOW}🔧 Step 4: Creating System Service${NC}"

# Create systemd service
cat > /etc/systemd/system/geo-dashboard.service << EOF
[Unit]
Description=GEO Dashboard API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/node lib/api-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=${INSTALL_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R www-data:www-data $INSTALL_DIR
chmod 755 $INSTALL_DIR

echo -e "${GREEN}✅ System service created${NC}"

echo -e "\n${YELLOW}🌐 Step 5: Configuring Nginx${NC}"

# Create nginx config
cat > ${NGINX_AVAILABLE}/geo-dashboard << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    root ${INSTALL_DIR};
    index index.html;
    
    # Logging
    access_log /var/log/nginx/geo-dashboard-access.log;
    error_log /var/log/nginx/geo-dashboard-error.log;
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Enable site
if [ -L "${NGINX_ENABLED}/geo-dashboard" ]; then
    rm ${NGINX_ENABLED}/geo-dashboard
fi
ln -s ${NGINX_AVAILABLE}/geo-dashboard ${NGINX_ENABLED}/geo-dashboard

# Test nginx config
nginx -t

echo -e "${GREEN}✅ Nginx configured${NC}"

echo -e "\n${YELLOW}🔒 Step 6: Setting up SSL${NC}"

# Get SSL certificate
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} || true

echo -e "${GREEN}✅ SSL configured${NC}"

echo -e "\n${YELLOW}⏰ Step 7: Setting up Cron Jobs${NC}"

# Create cron jobs
(crontab -l 2>/dev/null || true; cat << EOF) | crontab -
# GEO Dashboard - Daily ranking checks at 6 AM
0 6 * * * cd ${INSTALL_DIR} && ./scheduler.sh daily >> logs/cron.log 2>&1

# GEO Dashboard - Weekly reports on Monday at 8 AM
0 8 * * 1 cd ${INSTALL_DIR} && ./scheduler.sh weekly >> logs/cron.log 2>&1

# GEO Dashboard - AI citation monitoring at 9 AM
0 9 * * * cd ${INSTALL_DIR} && node lib/ai-citation-monitor.js monitor-all >> logs/ai-cron.log 2>&1

# GEO Dashboard - Log rotation weekly
0 0 * * 0 cd ${INSTALL_DIR} && find logs -name "*.log" -mtime +30 -delete
EOF

echo -e "${GREEN}✅ Cron jobs configured${NC}"

echo -e "\n${YELLOW}🚀 Step 8: Starting Services${NC}"

# Reload systemd
systemctl daemon-reload

# Enable and start services
systemctl enable geo-dashboard
systemctl start geo-dashboard
systemctl reload nginx

# Wait for service to start
sleep 3

# Check status
if systemctl is-active --quiet geo-dashboard; then
    echo -e "${GREEN}✅ GEO Dashboard API is running${NC}"
else
    echo -e "${RED}❌ Service failed to start${NC}"
    echo "Check logs: journalctl -u geo-dashboard -n 50"
    exit 1
fi

echo -e "\n${YELLOW}🧪 Step 9: Testing Deployment${NC}"

# Test health endpoint
if curl -sf http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

# Test via nginx
if curl -sf https://${DOMAIN}/health > /dev/null; then
    echo -e "${GREEN}✅ HTTPS endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS endpoint not ready yet (DNS may be propagating)${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment Complete!                                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Dashboard: https://${DOMAIN}"
echo "📖 API Docs:  https://${DOMAIN}/api/health"
echo "🔧 Admin:     ssh to server + journalctl -u geo-dashboard -f"
echo ""
echo -e "${YELLOW}⚠️  Important: Update API keys in ${INSTALL_DIR}/.env${NC}"
echo ""
echo -e "${GREEN}🎉 GEO Dashboard is live!${NC}"
