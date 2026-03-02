# StackMatrices GEO Platform v2.0
## AI-Powered Local SEO for Medical Practices

---

## 🎯 What is GEO?

**GEO (Generative Engine Optimization)** = Being cited by AI

When someone asks Perplexity or ChatGPT:
> "What's the best med spa in Houston?"

The AI's answer should **cite your clinic**.

Traditional SEO = Rank on Google  
**GEO = Be the answer AI gives**

---

## ✅ What's Included

### Core Features
| Feature | Description | Status |
|---------|-------------|--------|
| **GEO Analysis** | Complete local SEO audit with AI citation scoring | ✅ |
| **AI Monitoring** | Track Perplexity citations in real-time | ✅ |
| **Content Generation** | AI-powered pages, GMB posts, FAQs | ✅ |
| **Schema Markup** | MedicalBusiness, LocalBusiness, FAQ structured data | ✅ |
| **Competitor Analysis** | Reverse-engineer top competitors | ✅ |
| **Automated Reports** | Weekly email reports to clients | ✅ |
| **API Access** | REST API for integrations | ✅ |

### Medical Specialties
- ✅ Medical Spas
- ✅ Plastic Surgery
- ✅ Dermatology
- ✅ Dentistry
- ✅ General Medical Practices

---

## 🚀 Quick Start

### 1. Install
```bash
cd core-engine
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Verify
```bash
npm run check        # Production readiness check
npm test             # Run test suite
```

### 4. Run First Analysis
```bash
./medical-pipeline.js "Your Clinic Name" "123 Main St, Houston, TX" "Medical Spa" "Botox" "Fillers"
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GEO Platform                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Data Layer │───▶│  Analysis    │───▶│   Content    │  │
│  │              │    │   Engine     │    │  Generator   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │            │
│         ▼                   ▼                   ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Apify       │    │  GEO Score   │    │  OpenAI      │  │
│  │  Google Maps │    │  AI Citation │    │  Content     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Monitoring & Reporting                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │  Daily   │  │  Weekly  │  │   AI     │          │    │
│  │  │  Checks  │  │  Reports │  │ Citations│          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing

| Package | Monthly | What's Included |
|---------|---------|-----------------|
| **Growth** | $500 | Monitoring + Weekly Reports + Optimization |
| **Scale** | $1,000 | + AI Content + GMB Management |
| **Enterprise** | $2,500 | + Multi-location + White-label |

**Setup Fee:** $2,000 one-time

**ROI:** 300-500% typical return

---

## 🛠️ API Reference

### Analyze a Business
```bash
POST /api/analyze
Content-Type: application/json
X-API-Key: your-api-key

{
  "businessName": "Glow Med Spa",
  "address": "123 Main St, Houston, TX",
  "industry": "medical",
  "services": ["Botox", "Fillers"],
  "async": true,
  "webhook": "https://your-app.com/webhook"
}
```

### Get Rankings
```bash
GET /api/monitoring/rankings/:clientId?days=30
X-API-Key: your-api-key
```

### Generate Report
```bash
POST /api/reports/weekly
X-API-Key: your-api-key

{
  "clientId": "client_123",
  "weekData": { ... }
}
```

---

## 📋 Operational Workflow

### Day 0: Client Signs
1. Collect business information
2. Send welcome email
3. Create client profile

### Day 1: Analysis
```bash
./geo-ai-pipeline.js "Business" "Address" "Industry" "Service1" "Service2"
```

### Day 3-7: Implementation
- Deploy Schema markup
- Optimize GMB profile
- Publish location page
- Submit to search engines

### Ongoing: Monitoring
- **Daily:** Ranking checks (6:00 AM)
- **Daily:** AI citation monitoring (9:00 AM)
- **Weekly:** Report generation (Monday 8:00 AM)
- **Monthly:** ROI analysis + strategy review

---

## 🔧 Configuration

### Required Environment Variables
```env
APIFY_TOKEN=           # For data scraping
SUPABASE_URL=          # For database
SUPABASE_KEY=          # For database
```

### Optional (Enhanced Features)
```env
OPENAI_API_KEY=        # AI content generation
BRIGHTDATA_API_TOKEN=  # Perplexity scraping
EMAIL_SMTP_HOST=       # Report emails
SLACK_WEBHOOK_URL=     # Alert notifications
```

---

## 📊 Expected Results

### 30 Days
- ✅ Complete GEO audit delivered
- ✅ Schema deployed on website
- ✅ GMB fully optimized
- ✅ Monitoring active

### 60 Days
- ✅ Google rankings improve 3-5 positions
- ✅ First AI citations appear
- ✅ Website traffic +30%
- ✅ Consultation inquiries increase

### 90 Days
- ✅ 3-5 keywords on page 1
- ✅ AI citation rate +35%
- ✅ Positive ROI achieved
- ✅ Sustained growth trajectory

---

## 🐛 Troubleshooting

### Apify Connection Failed
```bash
node test-apify.js
# Check APIFY_TOKEN in .env
```

### Database Errors
```bash
# Run schema setup
psql $SUPABASE_URL -f ../supabase/schema-simple.sql
```

### Email Not Sending
```bash
# Verify SMTP settings
# Check spam folders
# Test with: node -e "import('./lib/email-service.js').then(e => e.sendWelcomeEmail('test@test.com', 'Test', '#'))"
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `medical-pipeline.js` | Main analysis pipeline |
| `geo-ai-pipeline.js` | Full GEO + AI optimization |
| `dashboard.js` | System status dashboard |
| `scheduler.sh` | Daily/weekly automation |
| `pricing.js` | Client pricing calculator |
| `lib/api-server.js` | REST API server |
| `lib/openai-generator.js` | AI content generation |
| `lib/email-service.js` | Automated email reports |

---

## 🤝 Support

- **Documentation:** `/docs` folder
- **Issues:** Check logs in `logs/` directory
- **Contact:** support@stackmatrices.com

---

## 📄 License

Proprietary - StackMatrices

---

**Ready to dominate AI search?** 🚀

Start with: `./medical-pipeline.js "Your Clinic" "Your Address"`
