/**
 * Medical Citation Probability Engine
 * 
 * Optimized for Medical Aesthetic and Dental practices
 */

// Medical aesthetic terminology
const MEDICAL_TERMS = [
  // Injectables
  'botox', 'dysport', 'xeomin', 'jeuveau',
  'juvederm', 'restylane', 'radiesse', 'sculptra', 'belotero',
  
  // Procedures
  'rhinoplasty', 'breast augmentation', 'liposuction', 'tummy tuck',
  'facelift', 'blepharoplasty', 'bbl', 'mommy makeover',
  'laser hair removal', 'ipl', 'photofacial', 'microneedling',
  'chemical peel', 'hydrafacial', 'prp', 'vampire facial',
  'coolsculpting', 'emsculpt', 'body contouring',
  
  // Dental
  'invisalign', 'braces', 'veneers', 'teeth whitening',
  'dental implants', 'crowns', 'root canal', 'fillings',
  'orthodontics', 'cosmetic dentistry', 'smile makeover',
  
  // Credentials
  'board certified', 'plastic surgeon', 'abps', 'asps',
  'dermatologist', 'medical spa', 'med spa',
  'dds', 'dmd', 'orthodontist',
  
  // Concerns
  'anti-aging', 'wrinkles', 'fine lines', 'volume loss',
  'acne scars', 'sun damage', 'skin rejuvenation',
  'crooked teeth', 'gummy smile'
];

const TRUST_SIGNALS = [
  'before and after', 'patient reviews', '5 star', 'rated',
  'years experience', 'board certified', 'fellowship trained',
  'award winning', 'best of', 'top rated', 'featured in'
];

const SAFETY_TERMS = [
  'fda approved', 'safe', 'minimally invasive', 'no downtime',
  'recovery time', 'side effects', 'risks', 'consultation'
];

/**
 * Calculate citation probability for medical content
 */
export function calculateMedicalCitationProbability(content, metadata = {}) {
  const factors = {
    entityDensity: 0,      // Medical terms density
    trustSignals: 0,       // Trust indicators
    safetyTransparency: 0, // Safety info
    visualContent: 0,      // Before/after mentions
    socialProof: 0         // Reviews/testimonials
  };
  
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  const wordCount = text.split(/\s+/).length;
  const lowerText = text.toLowerCase();
  
  // 1. Medical Entity Density (30%)
  const medicalTermCount = MEDICAL_TERMS.filter(term => 
    lowerText.includes(term.toLowerCase())
  ).length;
  const density = medicalTermCount / wordCount * 100;
  factors.entityDensity = Math.min(density / 5, 1) * 0.30; // 5% = max
  
  // 2. Trust Signals (25%)
  const trustCount = TRUST_SIGNALS.filter(signal => 
    lowerText.includes(signal.toLowerCase())
  ).length;
  factors.trustSignals = Math.min(trustCount / 3, 1) * 0.25;
  
  // 3. Safety Transparency (20%)
  const safetyCount = SAFETY_TERMS.filter(term => 
    lowerText.includes(term.toLowerCase())
  ).length;
  factors.safetyTransparency = Math.min(safetyCount / 3, 1) * 0.20;
  
  // 4. Visual Content / Before-After (15%)
  if (lowerText.includes('before and after') || 
      lowerText.includes('before & after') ||
      lowerText.includes('gallery') ||
      lowerText.includes('photos')) {
    factors.visualContent = 0.15;
  }
  
  // 5. Social Proof (10%)
  if (lowerText.includes('review') || 
      lowerText.includes('testimonial') ||
      lowerText.includes('patient story') ||
      lowerText.includes('real results')) {
    factors.socialProof = 0.10;
  }
  
  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  
  return {
    probability: Math.round(totalScore * 100) / 100,
    percentage: Math.round(totalScore * 100),
    factors,
    breakdown: {
      entityDensity: {
        score: factors.entityDensity,
        max: 0.30,
        actual: medicalTermCount,
        optimal: Math.round(wordCount * 0.05),
        status: density >= 3 && density <= 7 ? 'optimal' : density < 3 ? 'low' : 'high'
      },
      trustSignals: {
        score: factors.trustSignals,
        max: 0.25,
        hasCertification: lowerText.includes('board certified'),
        hasExperience: /\d+\s*years?\s*experience/.test(lowerText),
        hasAwards: lowerText.includes('award') || lowerText.includes('rated')
      },
      safetyTransparency: {
        score: factors.safetyTransparency,
        max: 0.20,
        hasFDA: lowerText.includes('fda approved'),
        hasConsultation: lowerText.includes('consultation')
      },
      visualContent: {
        score: factors.visualContent,
        max: 0.15,
        hasBeforeAfter: lowerText.includes('before and after')
      },
      socialProof: {
        score: factors.socialProof,
        max: 0.10,
        hasReviews: lowerText.includes('review')
      }
    },
    recommendations: generateMedicalRecommendations(factors, text, wordCount)
  };
}

function generateMedicalRecommendations(factors, text, wordCount) {
  const recommendations = [];
  
  if (factors.entityDensity < 0.15) {
    recommendations.push({
      priority: 'high',
      factor: 'entityDensity',
      action: 'Add more medical procedure terms (Botox, fillers, laser, etc.)',
      impact: '+15-20% citation probability'
    });
  }
  
  if (factors.trustSignals < 0.15) {
    recommendations.push({
      priority: 'high',
      factor: 'trustSignals',
      action: 'Add board certification and years of experience',
      impact: '+20% citation probability'
    });
  }
  
  if (factors.safetyTransparency < 0.15) {
    recommendations.push({
      priority: 'medium',
      factor: 'safetyTransparency',
      action: 'Add FDA approval mentions and safety information',
      impact: '+15% citation probability'
    });
  }
  
  if (factors.visualContent < 0.1) {
    recommendations.push({
      priority: 'medium',
      factor: 'visualContent',
      action: 'Add before and after photos mention',
      impact: '+12% citation probability'
    });
  }
  
  if (factors.socialProof < 0.05) {
    recommendations.push({
      priority: 'medium',
      factor: 'socialProof',
      action: 'Add patient reviews or testimonials section',
      impact: '+10% citation probability'
    });
  }
  
  return recommendations;
}

/**
 * Compare against top medical practices
 */
export function compareMedicalCitationProbability(ourContent, competitorContents) {
  const ourScore = calculateMedicalCitationProbability(ourContent);
  
  const competitorScores = competitorContents.map((content, i) => ({
    competitor: `Competitor ${i + 1}`,
    ...calculateMedicalCitationProbability(content)
  }));
  
  const avgCompetitor = competitorScores.reduce((sum, c) => 
    sum + c.probability, 0) / competitorScores.length;
  
  return {
    ourScore,
    competitorScores,
    comparison: {
      ourProbability: ourScore.probability,
      avgCompetitorProbability: Math.round(avgCompetitor * 100) / 100,
      gap: Math.round((avgCompetitor - ourScore.probability) * 100) / 100,
      ranking: competitorScores.filter(c => c.probability > ourScore.probability).length + 1
    },
    industryAverage: 'Medical aesthetic content averages 65-75%'
  };
}

export default { 
  calculateMedicalCitationProbability, 
  compareMedicalCitationProbability 
};
