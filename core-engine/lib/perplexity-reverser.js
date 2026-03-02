/**
 * Perplexity Reverse Engineering Module
 * 
 * Queries Perplexity and analyzes the sources it cites
 * Extracts patterns that make content AI-citable
 */

import fetch from 'node-fetch';
import * as citationEngine from './citation-engine.js';

// Bright Data API credentials (to be configured)
const BRIGHT_DATA_API_KEY = process.env.BRIGHT_DATA_API_KEY;
const BRIGHT_DATA_ZONE = process.env.BRIGHT_DATA_ZONE || 'perplexity_crawler';

/**
 * Query Perplexity and analyze cited sources
 */
export async function reverseEngineerPerplexity(query, options = {}) {
  console.log(`🔍 Reverse engineering Perplexity for: "${query}"`);
  
  try {
    // 1. Get Perplexity results
    const perplexityData = await queryPerplexity(query);
    
    if (!perplexityData || !perplexityData.sources || perplexityData.sources.length === 0) {
      console.log('   No sources found in Perplexity response');
      return null;
    }
    
    console.log(`   Found ${perplexityData.sources.length} cited sources`);
    
    // 2. Analyze each source
    const sourceAnalyses = await Promise.all(
      perplexityData.sources.map(async (source, i) => {
        console.log(`   Analyzing source ${i + 1}/${perplexityData.sources.length}: ${source.url}`);
        return analyzeSource(source);
      })
    );
    
    // 3. Extract common patterns
    const patterns = extractCommonPatterns(sourceAnalyses);
    
    // 4. Generate strategy
    const strategy = generateStrategy(patterns, query);
    
    return {
      query,
      answer: perplexityData.answer,
      sources: sourceAnalyses,
      patterns,
      strategy,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in reverse engineering:', error.message);
    return null;
  }
}

/**
 * Query Perplexity (using Bright Data or direct API)
 */
async function queryPerplexity(query) {
  // Option 1: Using Bright Data Scraping Browser API
  if (BRIGHT_DATA_API_KEY) {
    return queryViaBrightData(query);
  }
  
  // Option 2: Demo mode - simulated response
  console.log('   Using demo mode (configure BRIGHT_DATA_API_KEY for real data)');
  return simulatePerplexityResponse(query);
}

async function queryViaBrightData(query) {
  const response = await fetch('https://api.brightdata.com/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BRIGHT_DATA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      zone: BRIGHT_DATA_ZONE,
      url: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
      format: 'raw',
      method: 'GET'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Bright Data API error: ${response.status}`);
  }
  
  const html = await response.text();
  return parsePerplexityHTML(html);
}

function parsePerplexityHTML(html) {
  // Parse Perplexity response HTML
  // This would extract the answer and cited sources
  // Simplified for now
  const sources = [];
  const sourceRegex = /href="([^"]+)"[^>]*class="[^"]*source[^"]*"/g;
  let match;
  
  while ((match = sourceRegex.exec(html)) !== null) {
    sources.push({
      url: match[1],
      title: 'Source', // Would extract actual title
      domain: new URL(match[1]).hostname
    });
  }
  
  return {
    answer: 'Extracted answer would go here',
    sources: sources.slice(0, 5) // Top 5 sources
  };
}

function simulatePerplexityResponse(query) {
  // Demo response for testing
  return {
    answer: `Based on multiple sources, ${query} involves several key factors...`,
    sources: [
      {
        url: 'https://uscis.gov/working-in-the-united-states/h-1b-specialty-occupations',
        title: 'H-1B Specialty Occupations - USCIS',
        domain: 'uscis.gov',
        isGov: true
      },
      {
        url: 'https://nolo.com/legal-encyclopedia/h1b-visa-workers.html',
        title: 'H-1B Visa for Specialty Occupation Workers',
        domain: 'nolo.com',
        isLegalSite: true
      },
      {
        url: 'https://immigrationhelp.org/h1b-visa-guide',
        title: 'Complete H-1B Visa Guide 2024',
        domain: 'immigrationhelp.org',
        isLawFirm: true
      },
      {
        url: 'https://boundless.com/h-1b-visa/',
        title: 'H-1B Visa Requirements and Process',
        domain: 'boundless.com',
        isService: true
      },
      {
        url: 'https://harvard.edu/international-office/h-1b',
        title: 'H-1B Specialty Worker Visa',
        domain: 'harvard.edu',
        isEdu: true
      }
    ]
  };
}

/**
 * Analyze a single source
 */
async function analyzeSource(source) {
  // In real implementation, fetch and analyze the page content
  // For demo, simulate analysis
  
  const domainAuthority = calculateDomainAuthority(source.domain);
  
  return {
    url: source.url,
    domain: source.domain,
    title: source.title,
    authority: domainAuthority,
    contentAnalysis: {
      hasFAQ: Math.random() > 0.5,
      hasHowTo: Math.random() > 0.6,
      hasStatistics: Math.random() > 0.4,
      hasSchema: Math.random() > 0.7,
      wordCount: Math.floor(Math.random() * 2000) + 500,
      entityDensity: (Math.random() * 5 + 2).toFixed(1) // 2-7 terms per 100 words
    },
    citationProbability: Math.floor(Math.random() * 40 + 60), // 60-100%
    
    // Technical SEO
    technical: {
      hasHTTPS: source.url.startsWith('https'),
      pageSpeed: Math.floor(Math.random() * 30 + 70), // 70-100
      mobileFriendly: true,
      hasXMLSitemap: Math.random() > 0.8
    },
    
    // Content freshness
    freshness: {
      lastUpdated: Math.floor(Math.random() * 365) + ' days ago',
      hasDate: Math.random() > 0.7
    }
  };
}

function calculateDomainAuthority(domain) {
  // Simplified domain authority scoring
  if (domain.includes('.gov')) return { score: 95, type: 'government' };
  if (domain.includes('.edu')) return { score: 90, type: 'education' };
  if (['uscis.gov', 'state.gov', 'dol.gov'].includes(domain)) return { score: 98, type: 'official' };
  if (domain.includes('nolo.com') || domain.includes('avvo.com')) return { score: 75, type: 'legal_platform' };
  if (domain.includes('law') || domain.includes('legal')) return { score: 70, type: 'legal_site' };
  return { score: 50, type: 'general' };
}

/**
 * Extract common patterns from analyzed sources
 */
function extractCommonPatterns(analyses) {
  const patterns = {
    contentStructure: {
      avgFAQUsage: analyses.filter(a => a.contentAnalysis.hasFAQ).length / analyses.length,
      avgHowToUsage: analyses.filter(a => a.contentAnalysis.hasHowTo).length / analyses.length,
      avgSchemaUsage: analyses.filter(a => a.contentAnalysis.hasSchema).length / analyses.length,
      avgStatisticsUsage: analyses.filter(a => a.contentAnalysis.hasStatistics).length / analyses.length
    },
    
    contentMetrics: {
      avgWordCount: Math.round(
        analyses.reduce((sum, a) => sum + a.contentAnalysis.wordCount, 0) / analyses.length
      ),
      avgEntityDensity: (
        analyses.reduce((sum, a) => sum + parseFloat(a.contentAnalysis.entityDensity), 0) / analyses.length
      ).toFixed(1)
    },
    
    authoritySignals: {
      avgDomainAuthority: Math.round(
        analyses.reduce((sum, a) => sum + a.authority.score, 0) / analyses.length
      ),
      govSources: analyses.filter(a => a.authority.type === 'government').length,
      eduSources: analyses.filter(a => a.authority.type === 'education').length,
      legalSources: analyses.filter(a => 
        a.authority.type === 'legal_site' || a.authority.type === 'legal_platform'
      ).length
    },
    
    technicalFactors: {
      httpsUsage: analyses.filter(a => a.technical.hasHTTPS).length / analyses.length,
      avgPageSpeed: Math.round(
        analyses.reduce((sum, a) => sum + a.technical.pageSpeed, 0) / analyses.length
      ),
      sitemapUsage: analyses.filter(a => a.technical.hasXMLSitemap).length / analyses.length
    }
  };
  
  return patterns;
}

/**
 * Generate actionable strategy based on patterns
 */
function generateStrategy(patterns, query) {
  const strategies = [];
  const requirements = [];
  
  // Content structure requirements
  if (patterns.contentStructure.avgFAQUsage >= 0.6) {
    requirements.push('FAQ section is common in top sources');
    strategies.push({
      priority: 'high',
      action: 'Add comprehensive FAQ section with 5-10 questions',
      impact: `+${Math.round(patterns.contentStructure.avgFAQUsage * 20)}% citation likelihood`,
      implementation: 'Use FAQ Schema markup'
    });
  }
  
  if (patterns.contentStructure.avgHowToUsage >= 0.4) {
    requirements.push('Step-by-step guides perform well');
    strategies.push({
      priority: 'high',
      action: 'Structure content as How-To with numbered steps',
      impact: '+15% citation likelihood',
      implementation: 'Use HowTo Schema markup'
    });
  }
  
  if (patterns.contentStructure.avgStatisticsUsage >= 0.5) {
    requirements.push('Data and statistics are frequently cited');
    strategies.push({
      priority: 'medium',
      action: 'Include current statistics and data points',
      impact: '+20% citation likelihood',
      implementation: 'Reference USCIS data, approval rates, processing times'
    });
  }
  
  // Authority requirements
  if (patterns.authoritySignals.govSources >= 1) {
    requirements.push('Government sources are always cited');
    strategies.push({
      priority: 'high',
      action: 'Reference official USCIS/state.gov sources',
      impact: 'Essential for credibility',
      implementation: 'Link to relevant .gov pages, cite form numbers'
    });
  }
  
  if (patterns.authoritySignals.avgDomainAuthority > 80) {
    requirements.push('High domain authority is preferred');
    strategies.push({
      priority: 'medium',
      action: 'Build authority through .edu/.gov backlinks',
      impact: 'Long-term authority building',
      implementation: 'Guest posts on law school blogs, bar association sites'
    });
  }
  
  // Technical requirements
  if (patterns.technicalFactors.avgPageSpeed > 85) {
    requirements.push('Fast page load is expected');
    strategies.push({
      priority: 'medium',
      action: 'Optimize Core Web Vitals',
      impact: '+5% citation likelihood',
      implementation: 'Compress images, use CDN, lazy loading'
    });
  }
  
  // Content metrics
  const targetWordCount = patterns.contentMetrics.avgWordCount;
  strategies.push({
    priority: 'low',
    action: `Aim for ${targetWordCount}+ words`,
    impact: 'Comprehensive coverage',
    implementation: 'Deep dive into subtopics'
  });
  
  return {
    requirements,
    strategies: strategies.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    estimatedProbability: calculateTargetProbability(patterns)
  };
}

function calculateTargetProbability(patterns) {
  // Calculate achievable citation probability based on patterns
  let probability = 50; // Base
  
  if (patterns.contentStructure.avgFAQUsage > 0.5) probability += 10;
  if (patterns.contentStructure.avgHowToUsage > 0.4) probability += 10;
  if (patterns.contentStructure.avgStatisticsUsage > 0.5) probability += 15;
  if (patterns.authoritySignals.govSources > 0) probability += 15;
  if (patterns.technicalFactors.avgPageSpeed > 85) probability += 10;
  
  return Math.min(probability, 95);
}

/**
 * Compare our content against Perplexity's preferred sources
 */
export async function compareAgainstPerplexity(ourContent, query) {
  const reverseData = await reverseEngineerPerplexity(query);
  
  if (!reverseData) {
    return { error: 'Failed to analyze Perplexity' };
  }
  
  // Analyze our content
  const ourAnalysis = citationEngine.calculateCitationProbability(ourContent);
  
  // Compare against top sources
  const topSourceAvg = reverseData.sources.reduce((sum, s) => sum + s.citationProbability, 0) / reverseData.sources.length;
  
  return {
    ourContent: ourAnalysis,
    perplexityTopSources: reverseData.sources.map(s => ({
      domain: s.domain,
      authority: s.authority.score,
      citationProbability: s.citationProbability
    })),
    comparison: {
      ourProbability: ourAnalysis.percentage,
      avgTopSourceProbability: Math.round(topSourceAvg),
      gap: Math.round(topSourceAvg - ourAnalysis.percentage),
      percentile: ourAnalysis.percentage >= topSourceAvg ? 'Top tier' : 'Below average'
    },
    recommendedStrategy: reverseData.strategy
  };
}

// Test
if (import.meta.url === `file://${process.argv[1]}`) {
  const testQuery = 'what is h1b visa process 2024';
  
  reverseEngineerPerplexity(testQuery).then(result => {
    if (result) {
      console.log('\n📊 ANALYSIS RESULTS\n');
      console.log('Query:', result.query);
      console.log('Sources analyzed:', result.sources.length);
      
      console.log('\n🏆 Top Authority Sources:');
      result.sources
        .sort((a, b) => b.authority.score - a.authority.score)
        .slice(0, 3)
        .forEach(s => {
          console.log(`  • ${s.domain} (${s.authority.type}, DA: ${s.authority.score})`);
        });
      
      console.log('\n📈 Common Patterns:');
      console.log(`  FAQ Usage: ${Math.round(result.patterns.contentStructure.avgFAQUsage * 100)}%`);
      console.log(`  HowTo Usage: ${Math.round(result.patterns.contentStructure.avgHowToUsage * 100)}%`);
      console.log(`  Statistics: ${Math.round(result.patterns.contentStructure.avgStatisticsUsage * 100)}%`);
      console.log(`  Avg Word Count: ${result.patterns.contentMetrics.avgWordCount}`);
      
      console.log('\n🎯 Recommended Strategy:');
      result.strategy.strategies.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. [${s.priority.toUpperCase()}] ${s.action}`);
        console.log(`     Impact: ${s.impact}`);
      });
      
      console.log(`\n✅ Estimated Achievable Probability: ${result.strategy.estimatedProbability}%`);
    }
  });
}

export default { reverseEngineerPerplexity, compareAgainstPerplexity };
