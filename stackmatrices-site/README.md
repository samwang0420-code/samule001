# StackMatrices GEO Site

GEO marketing tool for Houston immigration lawyers. Deployed at `/geo` subdirectory.

## 🚀 Quick Start

```bash
cd stackmatrices-site
npm install
npm run dev
```

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

## 🏗️ Build

```bash
npm run build
# Output: dist/geo/
```

## 📤 Deploy

```bash
./deploy.sh
# Then upload dist/geo/ to stackmatrices.com/geo/
```

## ⚙️ Configuration

Create `.env` file:

```
APIFY_TOKEN=your_apify_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📊 Current Status

- ✅ Landing page
- ✅ GEO Audit form (frontend)
- ✅ Pricing page
- ✅ Houston market report
- ⚠️  API integration (needs Apify token)
- ⚠️  Database (needs Supabase setup)
- ⚠️  Email sending (needs integration)
