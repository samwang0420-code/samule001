# MEMORY.md - Long-term Memory

## Project: GEO + SEO Dual-Dimension Optimization Platform

### Core System Overview
- **Purpose**: SEO + GEO dual-dimension optimization for medical aesthetics and dental industries
- **Live URL**: https://dashboard.gspr-hub.site
- **GitHub**: https://github.com/samwang0420-code/samule001
- **Database**: https://fixemvsckapejyfwphft.supabase.co

### Key Technical Decisions (2026-03-02)

#### 1. Dual-Score System
- **SEO Score**: Technical (30%) + Content (40%) + Authority (30%)
- **GEO Score**: AI Citations (50%) + Knowledge Graph (30%) + Brand Mentions (20%)
- **Combined**: Dual Score = (SEO + GEO) / 2
- **Status Levels**: excellent (80+) / good (60+) / needs_improvement (40+) / critical (<40)

#### 2. Database Schema
```sql
- clients.seo_score / geo_score (main scores)
- tech_seo_score / content_seo_score / authority_seo_score
- ai_citation_score / knowledge_graph_score / brand_mentions_score
- Views: client_dual_scores, dashboard_stats, client_score_trends
```

#### 3. Supported Industries
- **Medical Spa**: Complete implementation
- **Dentistry**: Full support with specialized schema/templates
- **Extensible**: Dermatology, Plastic Surgery ready

#### 4. Auto-Iteration Engine
- **Function**: Scans geo_implementation_iterations table hourly
- **Auto-executes**: Algorithm/Technical/Content/Strategy updates
- **Self-evolving**: No human approval needed for execution

#### 5. System Architecture
```
Dashboard (Tailwind + Chart.js)
    ↓
API Server (Node.js + Express + JWT)
    ↓
Supabase (PostgreSQL) + File Storage (backup)
    ↓
Auto-iteration + Monitoring + Reporting
```

### Default Credentials
- **Login**: https://dashboard.gspr-hub.site/login.html
- **Username**: admin@geo.local
- **Password**: admin123

### API Key
- **Internal Key**: `geo-internal-samwang0420`
- **Health Check**: GET /api/health

### Critical Files Location
```
/supabase/add-dual-score-system.sql     - Database schema
/core-engine/lib/api-server.js          - Main API
/core-engine/public/index.html          - Dashboard
/core-engine/scripts/auto-iteration-engine.js  - Self-updating engine
```

### Work Preferences
- **Git Sync**: Mandatory before every deployment
- **Execution Style**: Direct implementation over analysis
- **Decision Making**: Execute without asking for approval on clear tasks
- **Communication**: Concise, no conversational filler

### Next Phase Priorities
1. Deploy dual-score visualization on Dashboard
2. Run SQL: add-dual-score-system.sql (if not done)
3. Install auto-iteration cron job
4. Test report generation end-to-end

### Notes
- System is designed for "SEO + GEO双管齐下" service model
- Differentiation from pure AI: Real data + Execution + Monitoring
- File storage fallback when database unavailable
- All major features implemented and tested
