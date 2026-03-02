# GEO Dashboard - Quick Deploy Commands
# Run these commands on your server to deploy

# ═══════════════════════════════════════════════════════════
# STEP 1: Go to repository
# ═══════════════════════════════════════════════════════════
cd /root/.openclaw/workspace-geo-arch/core-engine

# ═══════════════════════════════════════════════════════════
# STEP 2: Make scripts executable
# ═══════════════════════════════════════════════════════════
chmod +x *.sh

# ═══════════════════════════════════════════════════════════
# STEP 3: Run auto-deployment
# ═══════════════════════════════════════════════════════════
./auto-deploy.sh

# ═══════════════════════════════════════════════════════════
# OR Manual Docker Deploy
# ═══════════════════════════════════════════════════════════

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# ═══════════════════════════════════════════════════════════
# VERIFY DEPLOYMENT
# ═══════════════════════════════════════════════════════════

# Test local API
curl http://localhost:3000/health

# Test via domain
curl https://dashboard.gspr-hub.site/health

# Test API with key
curl -H "X-API-Key: $(grep API_KEYS .env | cut -d= -f2)" \
  https://dashboard.gspr-hub.site/api/clients

# ═══════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════

# If SSL fails, run certbot manually:
certbot --nginx -d dashboard.gspr-hub.site

# If containers fail:
docker-compose down
docker-compose up -d

# Check nginx logs:
tail -f /var/log/nginx/error.log

# Restart everything:
docker-compose restart
systemctl restart nginx
