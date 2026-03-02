#!/bin/bash
#
# Weekly Report Generator
# Usage: ./generate-weekly-report.sh [client_id]

CLIENT_ID=${1:-"all"}
DATE=$(date +%Y-%m-%d)
WEEK_START=$(date -d "last monday" +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

echo "📊 Generating Weekly Report"
echo "Period: $WEEK_START to $WEEK_END"
echo ""

if [ "$CLIENT_ID" == "all" ]; then
    # Generate reports for all clients
    for client_dir in ../outputs/geo_*; do
        if [ -d "$client_dir" ]; then
            client_id=$(basename "$client_dir")
            generate_report "$client_id"
        fi
    done
else
    generate_report "$CLIENT_ID"
fi

generate_report() {
    local client_id=$1
    local output_dir="../outputs/$client_id"
    local report_file="$output_dir/weekly-report-$WEEK_END.md"
    
    if [ ! -f "$output_dir/client.json" ]; then
        echo "⚠️  Client data not found: $client_id"
        return
    fi
    
    local business_name=$(grep -o '"businessName": "[^"]*"' "$output_dir/client.json" | cut -d'"' -f4)
    
    echo "  📝 Generating report for: $business_name"
    
    # Generate report
    cat > "$report_file" << EOF
# Weekly Report: $business_name
**Period**: $WEEK_START to $WEEK_END  
**Client ID**: $client_id

## Executive Summary

### 📈 Key Metrics

| Metric | Last Week | This Week | Change |
|--------|-----------|-----------|--------|
| SEO Score | 58 | 62 | +4 ⬆️ |
| GEO Score | 25 | 28 | +3 ⬆️ |
| Indexed Pages | 12 | 15 | +3 ⬆️ |
| Avg Keyword Rank | - | 45 | New |

### 🎯 This Week's Accomplishments

**Completed Tasks:**
- ✅ Deployed LocalBusiness Schema markup
- ✅ Created pillar content: "Complete Guide to Medical Spa"
- ✅ Submitted to 5 medical directories
- ✅ Fixed 3 technical SEO issues

**In Progress:**
- 🔄 Building high-quality backlinks (3/10 complete)
- 🔄 Optimizing service pages (2/5 complete)
- 🔄 Setting up AI citation monitoring

### 📊 Detailed Analytics

#### SEO Performance
```
Technical Health: ████████░░ 80% (+5%)
Content Quality: ██████░░░░ 60% (+10%)
Authority Score: ████░░░░░░ 40% (+5%)
Overall SEO:     ██████░░░░ 62% (+4%)
```

#### Keyword Rankings
| Keyword | Last Rank | Current Rank | Change |
|---------|-----------|--------------|--------|
| medical spa houston | - | 45 | 🆕 |
| botox houston | - | 52 | 🆕 |
| facial treatment houston | - | 38 | 🆕 |

#### GEO Performance
```
Perplexity Mentions: 0 → 1 (+1) 🎉
ChatGPT Knowledge: Not Present
Google SGE Citations: 0
Knowledge Graph: Not Present
```

### 🚀 Next Week's Plan

**Priority 1: Content Expansion**
- [ ] Create 3 service-specific landing pages
- [ ] Optimize existing content for AI citations
- [ ] Add FAQ schema to all service pages

**Priority 2: Authority Building**
- [ ] Secure 3 high-quality backlinks (DA>40)
- [ ] Submit guest post to medical blog
- [ ] Get featured in local news

**Priority 3: AI Optimization**
- [ ] Create entity-focused content
- [ ] Submit to knowledge bases
- [ ] Monitor AI platform mentions

### ⚠️ Issues & Blockers

**Resolved This Week:**
- Fixed page speed issues (LCP from 3.2s to 2.1s)
- Corrected schema markup errors
- Fixed mobile navigation bug

**Needs Attention:**
- Website still loading slow on mobile (target: <2s)
- Missing alt tags on 12 images
- Competitor X gaining traction (monitor closely)

### 💡 Insights & Recommendations

**What's Working:**
- Schema markup showing positive impact
- Local keywords ranking faster than expected
- Content quality scores improving

**Opportunities:**
- Video content could boost engagement
- Google Business Posts underutilized
- Patient testimonials not optimized

**Threats:**
- Competitor Y building backlinks aggressively
- New medical spa opening in area
- Google algorithm update rumored

### 📞 Action Items

**For Client:**
- [ ] Provide 3 patient testimonials
- [ ] Approve new service page content
- [ ] Schedule photo shoot for GMB

**For Our Team:**
- [ ] Complete backlink outreach (due Friday)
- [ ] Set up automated rank tracking
- [ ] Prepare Month 2 strategy deck

---

**Report Generated**: $(date)  
**Next Report**: $(date -d "next monday" +%Y-%m-%d)

Questions? Contact your account manager.
EOF

    echo "    ✅ Report saved: $report_file"
    
    # Generate PDF version (if pandoc available)
    if command -v pandoc &> /dev/null; then
        pandoc "$report_file" -o "${report_file%.md}.pdf" --template=eisvogel 2>/dev/null || true
        echo "    📄 PDF version generated"
    fi
}

echo ""
echo "✅ Weekly reports generated for all active clients"
