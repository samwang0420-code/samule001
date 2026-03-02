# Internal GEO System - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Server has Node.js 18+ installed
- [ ] Server has Docker & Docker Compose installed
- [ ] Domain `dashboard.gspr-hub.site` points to server IP
- [ ] Ports 80 and 443 are open in firewall
- [ ] Git repository is cloned to server

### 2. Configuration
- [ ] `.env` file created with all required variables
- [ ] `APIFY_TOKEN` is valid and has credits
- [ ] `SUPABASE_URL` and `SUPABASE_KEY` are correct
- [ ] Database schema has been executed in Supabase
- [ ] `API_KEYS` is set for internal access

### 3. SSL Certificate
- [ ] Domain DNS is propagated
- [ ] Certbot can validate domain
- [ ] SSL certificate generated successfully
- [ ] Auto-renewal cron job configured

### 4. Application Testing
- [ ] All npm packages installed (`npm install`)
- [ ] API tests pass (`node test-api.js`)
- [ ] Frontend loads correctly
- [ ] Dashboard shows data from API

### 5. Monitoring Setup
- [ ] Daily cron job for ranking checks
- [ ] Weekly cron job for reports
- [ ] Log rotation configured
- [ ] Health check endpoint responding

---

## Deployment Steps

### Step 1: Prepare Server
```bash
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install -y docker-compose
```

### Step 2: Deploy Application
```bash
# Clone or update repository
cd /opt
git clone [your-repo] geo-dashboard
cd geo-dashboard/core-engine

# Create .env file
cp .env.example .env
nano .env  # Edit with your credentials

# Deploy with Docker
./deploy-to-domain.sh dashboard.gspr-hub.site
```

### Step 3: Verify Deployment
```bash
# Check containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test API endpoints
npm run test:api

# Check SSL certificate
node test-api.js --ssl-only
```

---

## Post-Deployment Verification

### API Endpoints Test
Run this checklist manually:

```bash
# 1. Health check
curl https://dashboard.gspr-hub.site/health

# 2. API health
curl -H "X-API-Key: your-key" https://dashboard.gspr-hub.site/api/health

# 3. List clients
curl -H "X-API-Key: your-key" https://dashboard.gspr-hub.site/api/clients

# 4. Start analysis
curl -X POST \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test","address":"Houston, TX"}' \
  https://dashboard.gspr-hub.site/api/analyze
```

### Frontend Verification
- [ ] Dashboard loads at `https://dashboard.gspr-hub.site`
- [ ] Sidebar navigation works
- [ ] Stats cards display data
- [ ] Client table populates
- [ ] New analysis form submits

---

## Troubleshooting

### SSL Issues
```bash
# Check certificate
openssl s_client -connect dashboard.gspr-hub.site:443

# Renew certificate manually
docker-compose run --rm certbot renew
```

### API Not Responding
```bash
# Check if API server is running
docker-compose logs geo-dashboard

# Restart services
docker-compose restart
```

### Database Connection
```bash
# Test Supabase connection
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
supabase.from('clients').select('count').then(console.log);
"
```

---

## Maintenance

### Daily
- Monitor `/var/log/nginx/geo-dashboard-error.log`
- Check `docker-compose ps` status

### Weekly
- Review generated reports
- Check SSL certificate expiry
- Update system packages

### Monthly
- Review and rotate API keys
- Clean up old logs
- Backup database

---

## Emergency Contacts

- Server Admin: [your-email]
- Domain Provider: [provider]
- SSL: Let's Encrypt / Certbot
