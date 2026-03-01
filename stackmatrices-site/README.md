# StackMatrices GEO Site

GEO marketing tool for Houston immigration lawyers.

## 🚀 Quick Start

```bash
cd stackmatrices-site
npm install
npm run dev
```

Visit `http://localhost:4321/geo/`

## 📁 Structure

```
src/pages/geo/
├── index.astro              # Landing page
├── audit.astro              # Free GEO score tool
├── pricing.astro            # Pricing page
└── houston/
    └── immigration/
        └── index.astro      # Houston market report

src/pages/api/
└── geo-audit.js             # API endpoint

supabase/
└── schema.sql               # Database setup
```

## 🔧 Configuration

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

### Required for Production

| Variable | Service | Purpose |
|----------|---------|---------|
| `APIFY_TOKEN` | [Apify](https://apify.com) | Google Maps/SERP scraping |
| `SUPABASE_URL` | [Supabase](https://supabase.com) | Database |
| `SUPABASE_KEY` | [Supabase](https://supabase.com) | Database auth |
| `RESEND_API_KEY` | [Resend](https://resend.com) | Email sending |

### Optional

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |

## 🏗️ Build

```bash
npm run build
# Output: dist/geo/
```

## 📤 Deploy

### Option 1: Static hosting

```bash
./deploy.sh
# Upload dist/geo/ to stackmatrices.com/geo/
```

### Option 2: Vercel

```bash
npx vercel --prod
```

### Option 3: Netlify

```bash
npx netlify deploy --prod --dir=dist/geo
```

## 🧪 Testing

```bash
# Test API health
curl http://localhost:4321/api/geo-audit

# Test audit endpoint
curl -X POST http://localhost:4321/api/geo-audit \
  -H "Content-Type: application/json" \
  -d '{"firmName":"Test Firm","address":"123 Main St, Houston, TX","email":"test@example.com"}'
```

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ | Complete |
| GEO Audit form | ✅ | Complete with validation |
| Pricing page | ✅ | Complete |
| Houston report | ✅ | Complete |
| API endpoint | ✅ | Production-ready structure |
| Database schema | ✅ | Complete |
| Email integration | ⚠️ | Needs Resend API key |
| Apify integration | ⚠️ | Needs Apify token |
| Rate limiting | ⚠️ | Needs Upstash Redis |

## 📝 TODO

- [ ] Add real Apify Google Maps scraper
- [ ] Implement Supabase database inserts
- [ ] Add Resend email templates
- [ ] Set up Upstash rate limiting
- [ ] Add Sentry error tracking
- [ ] Create OG image (1200x630)
- [ ] Add favicon
- [ ] Test mobile responsiveness
- [ ] Accessibility audit (a11y)

## 🤝 Contributing

This is a production service. All changes should be tested locally before deployment.

## 📄 License

Proprietary - StackMatrices
