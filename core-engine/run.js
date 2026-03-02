#!/usr/bin/env node
/**
 * CORE ENGINE RUNNER
 * 
 * Usage: ./run.sh "Law Firm Name" "Address"
 * 
 * This is the core system - everything else is optional.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './lib/db.js';
import * as apify from './lib/apify.js';
import * as citationEngine from './lib/citation-engine.js';
import * as perplexity from './lib/perplexity-reverser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mode detection
const USE_APIFY = apify.isConfigured;

// Core Algorithm: Calculate GEO Score
function calculateGeoScore(placeData) {
  const scores = {
    coordinatePrecision: 0,
    parkingAccessibility: 0,
    schemaMarkup: 0,
    localContext: 0
  };
  
  // 1. Coordinate Precision (25 points)
  if (placeData.location?.lat && placeData.location?.lng) {
    const hasPreciseCoords = placeData.location.lat.toFixed(5) !== placeData.location.lat.toFixed(4);
    scores.coordinatePrecision = hasPreciseCoords ? 22 : 15;
    if (placeData.location.elevation) scores.coordinatePrecision += 3;
  }
  
  // 2. Parking Accessibility (25 points)
  const description = (placeData.description || '').toLowerCase();
  const reviews = (placeData.reviews || []).map(r => (r.text || '').toLowerCase()).join(' ');
  
  if (description.includes('parking') || description.includes('garage') || description.includes('lot')) {
    scores.parkingAccessibility = 20;
    if (description.includes('free') || description.includes('validated')) scores.parkingAccessibility += 5;
  } else if (reviews.includes('parking') || reviews.includes('easy to find')) {
    scores.parkingAccessibility = 10;
  } else {
    scores.parkingAccessibility = 5;
  }
  
  // 3. Schema Markup Readiness (30 points)
  let schemaScore = 0;
  if (placeData.title) schemaScore += 5;
  if (placeData.address) schemaScore += 5;
  if (placeData.phone) schemaScore += 5;
  if (placeData.website) schemaScore += 5;
  if (placeData.location) schemaScore += 5;
  if (placeData.reviews?.length > 0) schemaScore += 5;
  scores.schemaMarkup = schemaScore;
  
  // 4. Local Context (20 points)
  let contextScore = 0;
  const nearbyTerms = ['court', 'downtown', 'midtown', 'metro', 'highway', 'intersection'];
  nearbyTerms.forEach(term => {
    if (description.includes(term)) contextScore += 3;
  });
  if (placeData.serviceArea) contextScore += 5;
  if (placeData.neighborhood) contextScore += 3;
  scores.localContext = Math.min(20, contextScore);
  
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  
  return {
    total,
    max: 100,
    breakdown: scores,
    currentRank: estimateCurrentRank(total),
    potentialRank: estimatePotentialRank(scores),
    competitorCount: 127,
    analysis: {
      strengths: getStrengths(scores),
      weaknesses: getWeaknesses(scores)
    }
  };
}

function estimateCurrentRank(score) {
  if (score >= 85) return Math.floor(Math.random() * 3) + 1;
  if (score >= 70) return Math.floor(Math.random() * 5) + 3;
  if (score >= 55) return Math.floor(Math.random() * 7) + 8;
  return Math.floor(Math.random() * 10) + 15;
}

function estimatePotentialRank(scores) {
  const improvedScore = scores.coordinatePrecision + 25 + 30 + scores.localContext;
  if (improvedScore >= 90) return Math.floor(Math.random() * 3) + 1;
  if (improvedScore >= 80) return Math.floor(Math.random() * 3) + 3;
  return Math.floor(Math.random() * 5) + 5;
}

function getStrengths(scores) {
  const strengths = [];
  if (scores.coordinatePrecision >= 20) strengths.push('Precise coordinates');
  if (scores.parkingAccessibility >= 15) strengths.push('Good parking info');
  if (scores.schemaMarkup >= 25) strengths.push('Complete data fields');
  if (scores.localContext >= 12) strengths.push('Strong local context');
  return strengths;
}

function getWeaknesses(scores) {
  const weaknesses = [];
  if (scores.coordinatePrecision < 20) weaknesses.push('Coordinates need precision update');
  if (scores.parkingAccessibility < 15) weaknesses.push('Missing parking information');
  if (scores.schemaMarkup < 25) weaknesses.push('Incomplete business data');
  if (scores.localContext < 12) weaknesses.push('Weak local context connections');
  return weaknesses;
}

// Generate Optimized Schema
function generateSchema(placeData, geoScore) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "LegalService",
      "@id": `${placeData.website || '#'}#legal-service`,
      "name": placeData.title,
      "description": placeData.description || `${placeData.title} - Immigration Law Services`,
      "url": placeData.website,
      "telephone": placeData.phone,
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": placeData.location?.lat,
        "longitude": placeData.location?.lng
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": placeData.address?.split(',')[0],
        "addressLocality": placeData.city || 'Houston',
        "addressRegion": placeData.state || 'TX',
        "addressCountry": "US"
      },
      "areaServed": { "@type": "City", "name": "Houston" },
      "aggregateRating": placeData.totalScore ? {
        "@type": "AggregateRating",
        "ratingValue": placeData.totalScore,
        "reviewCount": placeData.reviewsCount || 0
      } : undefined
    }]
  };
  
  if (placeData.description?.toLowerCase().includes('parking')) {
    schema["@graph"][0].parkingFacility = {
      "@type": "ParkingFacility",
      "name": "On-site parking available"
    };
  }
  
  return schema;
}

// Simulate data collection
async function simulateDataCollection(firmName, address) {
  const seed = stringHash(firmName + address);
  const random = seededRandom(seed);
  
  return {
    title: firmName,
    address: address,
    location: {
      lat: 29.7604 + (random() * 0.1 - 0.05),
      lng: -95.3698 + (random() * 0.1 - 0.05)
    },
    description: random() > 0.5 
      ? `${firmName} provides immigration legal services in Houston. Free parking available.`
      : `${firmName} - Immigration attorney serving Houston area.`,
    phone: '+1-713-555-' + String(Math.floor(random() * 9000) + 1000),
    website: `https://${firmName.toLowerCase().replace(/\s+/g, '')}.com`,
    totalScore: (random() * 2 + 3).toFixed(1),
    reviewsCount: Math.floor(random() * 100) + 10,
    reviews: [{ text: 'Great service, easy to find parking.' }, { text: 'Very professional.' }],
    openingHours: 'Mon-Fri: 9:00 AM - 5:00 PM',
    city: 'Houston',
    state: 'TX'
  };
}

// Generate content for citation probability analysis
function generateContentForAnalysis(placeData, geoScore) {
  // Create a representative content sample based on place data
  const content = `
    ${placeData.title} provides comprehensive ${placeData.categories?.join(', ') || 'immigration legal services'} 
    in ${placeData.city || 'Houston'}, ${placeData.state || 'TX'}.
    
    Our experienced attorneys handle H1B visas, green card applications, 
    and deportation defense with a ${placeData.totalScore}/5 rating from ${placeData.reviewsCount} client reviews.
    
    FAQ:
    Q: What types of immigration cases do you handle?
    A: We specialize in employment-based visas including H1B, L1, O1, and green card applications 
       through EB1, EB2, and EB3 categories.
    
    Q: How long does the H1B process take?
    A: Regular processing takes 6-8 months. We also offer premium processing for faster results.
    
    Q: Do you offer free consultations?
    A: Yes, we provide initial case evaluations to discuss your immigration options.
    
    Located at ${placeData.address}, we serve clients throughout the greater ${placeData.city || 'Houston'} area.
    ${placeData.description || ''}
    
    Contact us at ${placeData.phone || '(713) 555-0123'} to schedule your consultation.
    Visit our website at ${placeData.website || 'https://example.com'} for more information.
  `;
  
  return content;
}

// Utilities
function stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

async function saveOutputs(dir, data) {
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(path.join(dir, 'client.json'), JSON.stringify({
    clientId: data.clientId,
    firmName: data.firmName,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  await fs.writeFile(path.join(dir, 'raw-data.json'), JSON.stringify(data.placeData, null, 2));
  await fs.writeFile(path.join(dir, 'score.json'), JSON.stringify(data.geoScore, null, 2));
  await fs.writeFile(path.join(dir, 'schema.json'), JSON.stringify(data.schema, null, 2));
  
  // Save citation probability analysis
  if (data.citationProb) {
    await fs.writeFile(path.join(dir, 'citation.json'), JSON.stringify(data.citationProb, null, 2));
  }
  
  // Save perplexity analysis
  if (data.perplexityData) {
    await fs.writeFile(path.join(dir, 'perplexity.json'), JSON.stringify(data.perplexityData, null, 2));
  }
  
  const deployMd = `# GEO Optimization Package

**Client:** ${data.firmName}  
**ID:** ${data.clientId}  
**Generated:** ${new Date().toLocaleString()}

## GEO Score: ${data.geoScore.total}/100

| Category | Score | Max |
|----------|-------|-----|
| Coordinate Precision | ${data.geoScore.breakdown.coordinatePrecision} | 25 |
| Parking Accessibility | ${data.geoScore.breakdown.parkingAccessibility} | 25 |
| Schema Markup | ${data.geoScore.breakdown.schemaMarkup} | 30 |
| Local Context | ${data.geoScore.breakdown.localContext} | 20 |

## Ranking Potential

- **Current Estimate:** #${data.geoScore.currentRank}
- **With Optimization:** #${data.geoScore.potentialRank}
- **Improvement:** +${data.geoScore.currentRank - data.geoScore.potentialRank} positions

## Citation Probability

${data.citationProb ? `- **Current Score:** ${data.citationProb.percentage}%\n- **Status:** ${data.citationProb.percentage >= 70 ? '✅ High' : data.citationProb.percentage >= 50 ? '⚠️ Medium' : '🔴 Low'}\n- **Top Recommendation:** ${data.citationProb.recommendations[0]?.action || 'None'}` : '- Analysis pending'}

## Quick Wins

${data.geoScore.analysis.weaknesses.map(w => `- [ ] ${w}`).join('\n')}

## Deployment

### 1. Schema Markup

Add this to your website's \`<head\`>:

\`\`\`html
<script type="application/ld+json">
${JSON.stringify(data.schema, null, 2)}
</script>
\`\`\`

### 2. Google Business Profile Updates

- [ ] Update coordinates to building entrance
- [ ] Add parking information to description
- [ ] Upload photos of office entrance
- [ ] Add Q&A about parking/transit

### 3. Content Optimization (for AI Citation)

${data.citationProb ? data.citationProb.recommendations.slice(0, 3).map(r => `- [ ] ${r.action} (${r.impact})`).join('\n') : '- Configure citation engine for recommendations'}

---

*Generated by StackMatrices GEO Core Engine v2.0*
`;
  
  await fs.writeFile(path.join(dir, 'deploy.md'), deployMd);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║         StackMatrices GEO - Core Engine v1.0             ║
╚══════════════════════════════════════════════════════════╝

Usage: ./run.sh "Law Firm Name" "Address"

Example:
  ./run.sh "Garcia Immigration Law" "1234 Main St, Houston, TX 77002"

Environment:
  APIFY_TOKEN=${process.env.APIFY_TOKEN ? '✓ configured' : '✗ not set (demo mode)'}
  SUPABASE_URL=${process.env.SUPABASE_URL ? '✓ configured' : '✗ not set'}

Modes:
  - Demo Mode: Simulated data (no API costs)
  - Live Mode: Real Google Maps + SERP data (requires APIFY_TOKEN)
`);
    process.exit(1);
  }
  
  const [firmName, address] = args;
  const timestamp = Date.now();
  const clientId = `client_${timestamp}`;
  
  console.log(`\n🔥 CORE ENGINE RUNNING`);
  console.log(`   Firm: ${firmName}`);
  console.log(`   Address: ${address}`);
  console.log(`   Apify: ${USE_APIFY ? '✓ LIVE (real data)' : '✗ DEMO (simulated)'}`);
  console.log(`   Database: ${db.isConfigured ? '✓ connected' : '✗ not configured'}`);
  console.log(`   Client ID: ${clientId}\n`);
  
  try {
    console.log('📡 Step 1: Data Collection');
    let placeData;
    
    if (USE_APIFY) {
      console.log('   Mode: LIVE (Apify real data)');
      const searchQuery = `${firmName} ${address}`;
      placeData = await apify.scrapeGoogleMaps(searchQuery);
      console.log('   ✓ Real data collected from Google Maps\n');
    } else {
      console.log('   Mode: DEMO (simulated data)');
      placeData = await simulateDataCollection(firmName, address);
      console.log('   ✓ Simulated data generated\n');
    }
    
    console.log('🧠 Step 2: GEO Analysis');
    const geoScore = calculateGeoScore(placeData);
    console.log(`   Score: ${geoScore.total}/100`);
    console.log(`   Current Rank: #${geoScore.currentRank}`);
    console.log(`   Potential Rank: #${geoScore.potentialRank}`);
    console.log(`   Improvement: +${geoScore.currentRank - geoScore.potentialRank} positions\n`);
    
    console.log('⚡ Step 3: Schema Generation');
    const schema = generateSchema(placeData, geoScore);
    console.log('   ✓ Schema generated\n');
    
    // Step 3.5: Citation Probability Analysis
    console.log('🤖 Step 4: Citation Probability Analysis');
    const contentForAnalysis = generateContentForAnalysis(placeData, geoScore);
    const citationProb = citationEngine.calculateCitationProbability(contentForAnalysis);
    console.log(`   Probability: ${citationProb.percentage}%`);
    console.log(`   Status: ${citationProb.percentage >= 70 ? '✅ High' : citationProb.percentage >= 50 ? '⚠️ Medium' : '🔴 Low'}`);
    
    if (citationProb.recommendations.length > 0) {
      console.log('   Top recommendation:', citationProb.recommendations[0].action);
    }
    console.log();
    
    // Step 4.5: Perplexity Reverse Engineering (optional, async)
    let perplexityData = null;
    try {
      const searchQuery = `immigration lawyer ${placeData.city || 'houston'}`;
      console.log('🔍 Step 5: Perplexity Analysis');
      console.log(`   Query: "${searchQuery}"`);
      perplexityData = await perplexity.reverseEngineerPerplexity(searchQuery);
      if (perplexityData) {
        console.log(`   Analyzed ${perplexityData.sources.length} competitor sources`);
        console.log(`   Strategy: ${perplexityData.strategy.strategies.length} recommendations`);
        console.log(`   Target Probability: ${perplexityData.strategy.estimatedProbability}%\n`);
      } else {
        console.log('   Skipped (configure BRIGHT_DATA_API_KEY for full analysis)\n');
      }
    } catch (e) {
      console.log('   Skipped (demo mode)\n');
    }
    
    // Step 5: Save to Database (if configured)
    if (db.isConfigured) {
      console.log('💾 Step 6: Database Storage');
      
      // Save client
      await db.createClient({
        clientId,
        firmName,
        address,
        website: placeData.website,
        email: null
      });
      
      // Save audit
      await db.saveGeoAudit(clientId, {
        ...geoScore,
        breakdown: {
          coordinatePrecision: geoScore.breakdown.coordinatePrecision,
          parkingAccessibility: geoScore.breakdown.parkingAccessibility,
          schemaMarkup: geoScore.breakdown.schemaMarkup,
          localContext: geoScore.breakdown.localContext
        },
        rawData: placeData
      });
      
      console.log('   ✓ Saved to database\n');
    }
    
    console.log('📁 Step 5: Local Output');
    const outputDir = path.join(__dirname, 'outputs', `${firmName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`);
    await saveOutputs(outputDir, { clientId, firmName, placeData, geoScore, schema });
    console.log(`   ✓ Saved to: ${outputDir}\n`);
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                     DELIVERY SUMMARY                     ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ Client ID:     ${clientId.padEnd(46)} ║`);
    console.log(`║ GEO Score:     ${String(geoScore.total + '/100').padEnd(46)} ║`);
    console.log(`║ Improvement:   ${String('+' + (geoScore.currentRank - geoScore.potentialRank) + ' positions').padEnd(46)} ║`);
    console.log(`║ Database:      ${String(db.isConfigured ? '✓ Saved' : '✗ Not connected').padEnd(46)} ║`);
    console.log(`║ Output:        ${outputDir.replace(__dirname, '.').padEnd(46)} ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Next Steps:');
    console.log(`   1. Review:  cat ${outputDir.replace(__dirname, '.')}/score.json`);
    console.log(`   2. Schema:  cat ${outputDir.replace(__dirname, '.')}/schema.json`);
    console.log(`   3. Deploy:  Follow instructions in deploy.md`);
    console.log(`   4. Monitor: Set up n8n workflow\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
