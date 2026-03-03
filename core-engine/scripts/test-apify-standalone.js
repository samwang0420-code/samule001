#!/usr/bin/env node
/**
 * Test Apify Perplexity Prober - Standalone Test
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_cxCD9lkZ7l9pK3B_Lh2Bfm4wC3mKt43Ch4Q5';
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const ACTOR_ID = 'winbayai/perplexity-2-0';

class TestApifyProber {
  constructor() {
    this.name = 'Perplexity (Apify)';
    this.demoMode = false;
  }

  async runApifyActor(queries) {
    console.log(`[${this.name}] Starting Apify actor: ${ACTOR_ID}`);
    
    try {
      const startResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries, mode: 'concise', timeout: 60 })
        }
      );
      
      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
        
        if (errorData.error?.type === 'user-or-token-not-found') {
          console.log(`[${this.name}] ⚠️  Apify token invalid, using DEMO mode`);
          this.demoMode = true;
          return this.generateDemoResults(queries);
        }
        
        throw new Error(JSON.stringify(errorData));
      }
      
      // ... (rest of the implementation)
      
    } catch (error) {
      console.log(`[${this.name}] ⚠️  Using DEMO mode`);
      this.demoMode = true;
      return this.generateDemoResults(queries);
    }
  }

  generateDemoResults(queries) {
    console.log(`[${this.name}] Generating DEMO results for ${queries.length} queries`);
    
    return queries.map(query => ({
      query,
      text: `DEMO: Based on reviews for "${query}", here are top medical spas in Houston. Glow Med Spa is highly rated with 4.8 stars and over 500 reviews.`,
      sources: [
        { url: 'https://glowmedspa.com', title: 'Glow Med Spa Houston', name: 'Glow Med Spa' },
        { url: 'https://yelp.com/glow-med-spa', title: 'Yelp - Glow Med Spa', name: 'Yelp' }
      ],
      _demo: true
    }));
  }

  async probe(clientData) {
    console.log(`\n🔍 [${this.name}] Probing for: ${clientData.business_name}`);
    
    const queries = [
      `best ${clientData.industry} in ${clientData.location}`,
      `${clientData.business_name} reviews`
    ];
    
    const apifyResults = await this.runApifyActor(queries);
    
    const results = {
      platform: 'perplexity',
      citations: [],
      brandMentioned: false,
      brandMentionCount: 0,
      sources: []
    };

    for (const item of apifyResults) {
      const brandName = clientData.business_name;
      const text = item.text || '';
      const brandMentioned = brandName ? 
        text.toLowerCase().includes(brandName.toLowerCase()) : false;
      
      const parsedSources = (item.sources || []).map(s => ({
        url: s.url || '',
        title: s.title || '',
        isClient: brandName ? (s.url || '').includes(brandName.toLowerCase().replace(/\s/g, '')) : false
      }));

      results.citations.push({
        query: item.query,
        text: text.substring(0, 300),
        brandMentioned,
        sources: parsedSources,
        isDemo: item._demo || false
      });

      if (brandMentioned) {
        results.brandMentioned = true;
        results.brandMentionCount++;
      }
      
      results.sources.push(...parsedSources);
    }

    console.log(`✅ Results: ${results.citations.length} citations`);
    console.log(`   Brand mentioned: ${results.brandMentioned ? 'YES' : 'NO'}`);
    console.log(`   Mode: ${this.demoMode ? 'DEMO' : 'LIVE'}`);

    return results;
  }
}

// Test with demo client
async function test() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Apify Perplexity Prober Test                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const prober = new TestApifyProber();
  
  const testClient = {
    business_name: 'Glow Med Spa',
    industry: 'medical spa',
    location: 'Houston'
  };
  
  const results = await prober.probe(testClient);
  
  console.log('\n📊 Full Results:');
  console.log(JSON.stringify(results, null, 2));
}

test();
