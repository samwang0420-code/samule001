# GEO Dashboard - AI-Powered Local SEO Platform

[![Tests](https://github.com/yourusername/geo-dashboard/actions/workflows/test.yml/badge.svg)](https://github.com/yourusername/geo-dashboard/actions/workflows/test.yml)
[![Deploy](https://github.com/yourusername/geo-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/geo-dashboard/actions/workflows/deploy.yml)

## 🎯 What is GEO?

**GEO (Generative Engine Optimization)** = Being cited by AI

When someone asks Perplexity or ChatGPT "What's the best med spa in Houston?" - the AI's answer should **cite your clinic**.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/geo-dashboard.git
cd geo-dashboard/core-engine

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run dev

# Deploy
npm run deploy
```

## 📁 Project Structure

```
geo-dashboard/
├── core-engine/           # Main application
│   ├── lib/              # Core modules
│   ├── public/           # Frontend assets
│   ├── *.js              # CLI scripts
│   └── docker-compose.yml
├── .github/workflows/    # CI/CD pipelines
└── docs/                 # Documentation
```

## 🛠️ Development

### Requirements
- Node.js 18+
- Docker & Docker Compose
- Supabase account
- Apify account

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm test` | Run test suite |
| `npm run test:api` | Test API endpoints |
| `npm run deploy` | Deploy to production |

## 📝 Environment Variables

```env
# Required
APIFY_TOKEN=xxx
SUPABASE_URL=xxx
SUPABASE_KEY=xxx

# Optional
OPENAI_API_KEY=xxx
EMAIL_SMTP_HOST=xxx
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Proprietary - StackMatrices

## 🙏 Credits

Built by Tomen for StackMatrices
