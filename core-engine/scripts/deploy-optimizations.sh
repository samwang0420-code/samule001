#!/bin/bash
#
# Deploy Optimization Package
# Usage: ./deploy-optimizations.sh [client_id]

CLIENT_ID=$1

if [ -z "$CLIENT_ID" ]; then
    echo "Usage: $0 [client_id]"
    echo "Example: $0 geo_1772454463408"
    exit 1
fi

CLIENT_DIR="../outputs/$CLIENT_ID"
DEPLOY_DIR="$CLIENT_DIR/deploy"

echo "🚀 Deploying Optimizations for: $CLIENT_ID"
echo ""

if [ ! -d "$CLIENT_DIR" ]; then
    echo "❌ Client directory not found: $CLIENT_DIR"
    exit 1
fi

# Create deploy directory
mkdir -p "$DEPLOY_DIR"

# ==========================================
# Step 1: Generate Schema Markup
# ==========================================
echo "📋 Step 1: Generating Schema Markup"

if [ -f "$CLIENT_DIR/client.json" ]; then
    business_name=$(grep -o '"businessName": "[^"]*"' "$CLIENT_DIR/client.json" | cut -d'"' -f4)
    website=$(grep -o '"website": "[^"]*"' "$CLIENT_DIR/client.json" | cut -d'"' -f4)
    
    # Generate LocalBusiness schema
    cat > "$DEPLOY_DIR/schema-localbusiness.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "name": "$business_name",
  "url": "$website",
  "@id": "$website",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[STREET_ADDRESS]",
    "addressLocality": "[CITY]",
    "addressRegion": "[STATE]",
    "postalCode": "[ZIP]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[LATITUDE]",
    "longitude": "[LONGITUDE]"
  },
  "telephone": "[PHONE]",
  "priceRange": "$$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ]
}
EOF
    echo "  ✅ Generated: schema-localbusiness.json"
    
    # Generate FAQ schema template
    cat > "$DEPLOY_DIR/schema-faq.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What services does $business_name offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER]"
      }
    },
    {
      "@type": "Question",
      "name": "How do I book an appointment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[ANSWER]"
      }
    }
  ]
}
EOF
    echo "  ✅ Generated: schema-faq.json"
fi

# ==========================================
# Step 2: Generate Content Templates
# ==========================================
echo ""
echo "📝 Step 2: Generating Content Templates"

mkdir -p "$DEPLOY_DIR/content"

# Pillar page template
if [ -f "$CLIENT_DIR/keyword-matrix.csv" ]; then
    main_keyword=$(head -2 "$CLIENT_DIR/keyword-matrix.csv" | tail -1 | cut -d',' -f1 | tr -d '"')
    
    cat > "$DEPLOY_DIR/content/pillar-page.md" << EOF
# The Complete Guide to $main_keyword

## Introduction
[Write a compelling introduction that includes the main keyword naturally. Target 150-200 words.]

## What is [Service]?
[Explain the service in detail. Include related keywords. Target 300-400 words.]

## Benefits of [Service]
- Benefit 1
- Benefit 2
- Benefit 3

## Why Choose $business_name
[Highlight unique selling points. Include E-E-A-T signals.]

## FAQ
### Q: How long does the treatment take?
A: [Answer]

### Q: Is there any downtime?
A: [Answer]

### Q: How much does it cost?
A: [Answer]

## Book Your Consultation
[Call to action with contact information]

---
**SEO Checklist:**
- [ ] Title contains main keyword (60 chars)
- [ ] H1 is unique and descriptive
- [ ] 3-5 H2 sections with keywords
- [ ] Internal links to service pages
- [ ] External links to authoritative sources
- [ ] Images with alt text
- [ ] Meta description 150 chars
- [ ] Schema markup added

**Word Count Target:** 1500-2500 words
EOF
    echo "  ✅ Generated: content/pillar-page.md"
fi

# ==========================================
# Step 3: Generate GMB Optimization Checklist
# ==========================================
echo ""
echo "📍 Step 3: Generating GMB Optimization Package"

cat > "$DEPLOY_DIR/gmb-optimization.md" << EOF
# Google Business Profile Optimization Checklist

## Profile Completeness
- [ ] Business name optimized
- [ ] Description (750 chars) with keywords
- [ ] Primary category: Medical Spa
- [ ] Secondary categories added
- [ ] Phone number verified
- [ ] Website URL added
- [ ] Appointment link added
- [ ] Hours updated

## Visual Content
- [ ] Logo uploaded
- [ ] Cover photo (high quality)
- [ ] 10+ interior photos
- [ ] 10+ exterior photos
- [ ] Team photos
- [ ] Before/after photos (compliant)
- [ ] Virtual tour

## Content Strategy
- [ ] Weekly Google Posts
- [ ] Q&A section populated
- [ ] Services listed with descriptions
- [ ] Products added (if applicable)

## Reviews
- [ ] Review request system
- [ ] Response templates
- [ ] All reviews responded to

## Posts Schedule
**Week 1:**
- Monday: Service highlight
- Wednesday: Before/After
- Friday: Promotion

**Week 2:**
- Monday: Educational content
- Wednesday: Team spotlight
- Friday: FAQ
EOF
echo "  ✅ Generated: gmb-optimization.md"

# ==========================================
# Step 4: Generate Deployment Instructions
# ==========================================
echo ""
echo "📦 Step 4: Generating Deployment Instructions"

cat > "$DEPLOY_DIR/DEPLOYMENT-GUIDE.md" << EOF
# Deployment Guide for $CLIENT_ID

## Package Contents

### 1. Schema Markup (/schema/)
- schema-localbusiness.json - Add to homepage
- schema-faq.json - Add to FAQ page
- schema-service.json - Add to service pages

### 2. Content Templates (/content/)
- pillar-page.md - Main pillar content
- service-pages/ - Individual service content
- blog-posts/ - Blog content calendar

### 3. GMB Optimization (/gmb/)
- gmb-optimization.md - Complete checklist
- post-templates/ - Weekly post templates
- photo-requirements.md - Photo specifications

## Deployment Steps

### Phase 1: Technical (Day 1-3)
1. Add Schema markup to website
2. Submit updated sitemap
3. Fix technical SEO issues
4. Verify mobile optimization

### Phase 2: Content (Day 4-10)
1. Publish pillar page
2. Update service pages
3. Create FAQ section
4. Add blog posts

### Phase 3: Authority (Day 11-20)
1. Submit to directories
2. Build backlinks
3. Optimize GMB
4. Create social profiles

## Verification Checklist

### After Deployment
- [ ] Schema validates (Google Rich Results Test)
- [ ] Pages indexed (Search Console)
- [ ] GMB profile complete
- [ ] Backlinks live
- [ ] Analytics tracking

### Week 1 Post-Deploy
- [ ] Rankings tracked
- [ ] Traffic monitored
- [ ] Issues identified
- [ ] Adjustments made

## Support

Questions? Contact your account manager.

---
Generated: $(date)
EOF
echo "  ✅ Generated: DEPLOYMENT-GUIDE.md"

# ==========================================
# Summary
# ==========================================
echo ""
echo "✅ Deployment Package Ready!"
echo ""
echo "📁 Location: $DEPLOY_DIR"
echo ""
echo "Package Contents:"
ls -1 "$DEPLOY_DIR/"
echo ""
echo "Next Steps:"
echo "1. Review deployment guide: $DEPLOY_DIR/DEPLOYMENT-GUIDE.md"
echo "2. Customize templates with client-specific information"
echo "3. Execute deployment according to timeline"
echo "4. Monitor results in dashboard"
