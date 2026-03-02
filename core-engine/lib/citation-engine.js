/**
 * Citation Probability Engine
 * 
 * Predicts how likely content is to be cited by Perplexity/ChatGPT/Claude
 * Based on 5 simplified factors from the 9-factor model
 */

// Legal terminology dictionary for immigration law
const LEGAL_TERMS = [
  // Visa types
  'h1b', 'l1', 'o1', 'eb1', 'eb2', 'eb3', 'eb5', 'f1', 'j1',
  // Green card
  'green card', 'permanent resident', 'adjustment of status', 'consular processing',
  // Processes
  'i-129', 'i-140', 'i-485', 'i-130', 'i-765', 'i-131', 'ds-260',
  // Agencies
  'uscis', 'dol', 'state department', 'immigration court', 'eoir',
  // Concepts
  'priority date', 'visa bulletin', 'labor certification', 'perm', 'rfe', 'noid',
  // Case types
  'family immigration', 'employment immigration', 'asylum', 'deportation defense'
];

/**
 * Calculate citation probability (0-1)
 */
export function calculateCitationProbability(content, metadata = {}) {
  const factors = {
    entityDensity: 0,      // 0.25 weight
    structureClarity: 0,   // 0.25 weight
    statisticalEvidence: 0, // 0.2 weight
    conversationalStyle: 0, // 0.15 weight
    freshness: 0           // 0.15 weight
  };
  
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  const wordCount = text.split(/\s+/).length;
  
  // 1. Entity Density (25%)
  // Optimal: 3-5 legal terms per 100 words
  const legalTermCount = countLegalTerms(text);
  const density = legalTermCount / wordCount * 100;
  factors.entityDensity = Math.min(density / 4, 1) * 0.25; // 4% = max score
  
  // 2. Structure Clarity (25%)
  if (hasFAQSchema(text)) factors.structureClarity += 0.125;
  if (hasHowToSchema(text)) factors.structureClarity += 0.125;
  
  // 3. Statistical Evidence (20%)
  if (hasStatistics(text)) factors.statisticalEvidence = 0.2;
  
  // 4. Conversational Style (15%)
  if (isConversational(text)) factors.conversationalStyle = 0.15;
  
  // 5. Freshness (15%)
  const contentDate = metadata.date || new Date();
  const daysOld = (new Date() - new Date(contentDate)) / (1000 * 60 * 60 * 24);
  if (daysOld < 30) factors.freshness = 0.15;
  else if (daysOld < 365) factors.freshness = 0.1;
  else factors.freshness = 0.05;
  
  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  
  return {
    probability: Math.round(totalScore * 100) / 100, // 0-1
    percentage: Math.round(totalScore * 100), // 0-100%
    factors,
    breakdown: {
      entityDensity: {
        score: factors.entityDensity,
        max: 0.25,
        actual: legalTermCount,
        optimal: Math.round(wordCount * 0.04),
        status: density >= 3 && density <= 5 ? 'optimal' : density < 3 ? 'low' : 'high'
      },
      structureClarity: {
        score: factors.structureClarity,
        max: 0.25,
        hasFAQ: hasFAQSchema(text),
        hasHowTo: hasHowToSchema(text)
      },
      statisticalEvidence: {
        score: factors.statisticalEvidence,
        max: 0.2,
        hasStats: hasStatistics(text)
      },
      conversationalStyle: {
        score: factors.conversationalStyle,
        max: 0.15,
        isConversational: isConversational(text)
      },
      freshness: {
        score: factors.freshness,
        max: 0.15,
        daysOld: Math.round(daysOld)
      }
    },
    recommendations: generateRecommendations(factors, text, wordCount)
  };
}

function countLegalTerms(text) {
  const lowerText = text.toLowerCase();
  return LEGAL_TERMS.filter(term => lowerText.includes(term.toLowerCase())).length;
}

function hasFAQSchema(text) {
  const lowerText = text.toLowerCase();
  return lowerText.includes('faq') || 
         lowerText.includes('frequently asked') ||
         lowerText.includes('question:') ||
         lowerText.includes('q:');
}

function hasHowToSchema(text) {
  const lowerText = text.toLowerCase();
  return lowerText.includes('how to') ||
         lowerText.includes('step 1') ||
         lowerText.includes('step 2') ||
         lowerText.includes('first,') ||
         lowerText.includes('next,');
}

function hasStatistics(text) {
  // Look for numbers with %, $, or statistical terms
  const statPatterns = [
    /\d+%/,
    /\$\d+/,
    /\d+ percent/,
    /\d+ out of \d+/,
    /average|median|mean/,
    /statistics|data|study|research/
  ];
  return statPatterns.some(pattern => pattern.test(text));
}

function isConversational(text) {
  const conversationalMarkers = [
    'you', 'your', 'we', 'our', 'us',
    "let's", "don't worry", "important to note",
    'understand that', 'keep in mind'
  ];
  const lowerText = text.toLowerCase();
  const markerCount = conversationalMarkers.filter(m => lowerText.includes(m)).length;
  return markerCount >= 3; // At least 3 conversational markers
}

function generateRecommendations(factors, text, wordCount) {
  const recommendations = [];
  
  if (factors.entityDensity < 0.15) {
    const needed = Math.round(wordCount * 0.04);
    recommendations.push({
      priority: 'high',
      factor: 'entityDensity',
      action: `Add ${needed} more immigration law terms (H1B, green card, USCIS, etc.)`,
      impact: '+10-15% citation probability'
    });
  }
  
  if (factors.structureClarity < 0.125) {
    recommendations.push({
      priority: 'high',
      factor: 'structureClarity',
      action: 'Add FAQ section or How-To structure',
      impact: '+12% citation probability'
    });
  }
  
  if (factors.statisticalEvidence < 0.15) {
    recommendations.push({
      priority: 'medium',
      factor: 'statisticalEvidence',
      action: 'Add statistics or data (approval rates, processing times)',
      impact: '+20% citation probability'
    });
  }
  
  if (factors.conversationalStyle < 0.1) {
    recommendations.push({
      priority: 'medium',
      factor: 'conversationalStyle',
      action: 'Use more "you/we" and conversational language',
      impact: '+15% citation probability'
    });
  }
  
  if (factors.freshness < 0.1) {
    recommendations.push({
      priority: 'low',
      factor: 'freshness',
      action: 'Update content with latest immigration news',
      impact: '+10% citation probability'
    });
  }
  
  return recommendations;
}

/**
 * Compare content against top-ranking competitors
 */
export function compareCitationProbability(ourContent, competitorContents) {
  const ourScore = calculateCitationProbability(ourContent);
  
  const competitorScores = competitorContents.map((content, i) => ({
    competitor: `Competitor ${i + 1}`,
    ...calculateCitationProbability(content)
  }));
  
  const avgCompetitor = competitorScores.reduce((sum, c) => sum + c.probability, 0) / competitorScores.length;
  
  return {
    ourScore,
    competitorScores,
    comparison: {
      ourProbability: ourScore.probability,
      avgCompetitorProbability: Math.round(avgCompetitor * 100) / 100,
      gap: Math.round((avgCompetitor - ourScore.probability) * 100) / 100,
      ranking: competitorScores.filter(c => c.probability > ourScore.probability).length + 1
    }
  };
}

// Test
if (import.meta.url === `file://${process.argv[1]}`) {
  const testContent = `
    Applying for an H1B visa can be complex. Here are the steps:
    
    First, your employer must file an I-129 petition with USCIS.
    The approval rate for H1B petitions in 2024 was 87%.
    
    Next, you'll need to wait for the LCA certification from DOL.
    Processing typically takes 7 months for regular filing.
    
    FAQ:
    Q: Can I apply without an employer?
    A: No, you need employer sponsorship.
    
    We understand this process can be stressful. Our team has helped 
    over 500 clients secure their H1B visas.
  `;
  
  const result = calculateCitationProbability(testContent);
  console.log('Citation Probability:', result.percentage + '%');
  console.log('\nBreakdown:');
  console.log('  Entity Density:', result.breakdown.entityDensity.status, 
    `(${result.breakdown.entityDensity.actual}/${result.breakdown.entityDensity.optimal} terms)`);
  console.log('  Structure:', result.breakdown.structureClarity.hasFAQ ? 'Has FAQ' : 'No FAQ');
  console.log('  Statistics:', result.breakdown.statisticalEvidence.hasStats ? 'Yes' : 'No');
  console.log('\nTop Recommendations:');
  result.recommendations.slice(0, 3).forEach(r => {
    console.log(`  [${r.priority.toUpperCase()}] ${r.action}`);
    console.log(`       Impact: ${r.impact}`);
  });
}

export default { calculateCitationProbability, compareCitationProbability };
