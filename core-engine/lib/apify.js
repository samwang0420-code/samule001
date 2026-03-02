/**
 * Apify Integration - Real Data Source
 * 
 * Replaces simulated data with actual Google Maps scraping
 */

import fetch from 'node-fetch';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const GOOGLE_MAPS_ACTOR = 'compass/crawler-google-places';
const SERP_ACTOR = 'apify/google-search-scraper';

// Convert actor ID to URL format (replace / with ~)
function getActorUrlId(actorId) {
  return actorId.replace('/', '~');
}

// Check if Apify is configured
export const isConfigured = !!APIFY_TOKEN;

/**
 * Scrape Google Maps for business data
 */
export async function scrapeGoogleMaps(searchQuery, options = {}) {
  if (!isConfigured) {
    throw new Error('APIFY_TOKEN not configured. Set it in .env file.');
  }

  console.log('🌐 Calling Apify Google Maps API...');
  
  // 1. Start the actor run
  const actorUrlId = getActorUrlId(GOOGLE_MAPS_ACTOR);
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorUrlId}/runs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        search: searchQuery,
        maxCrawledPlaces: options.maxResults || 1,
        includeReviews: true,
        includeImages: false,
        scrapePlaceName: true,
        scrapeReviews: true,
        maxReviews: 10,
        scrapeContactInfo: true
      })
    }
  );

  if (!runResponse.ok) {
    const error = await runResponse.text();
    throw new Error(`Apify start failed: ${error}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  
  console.log(`   Run ID: ${runId}`);
  console.log('   Waiting for completion...');
  
  // 2. Poll for completion
  const datasetId = await waitForCompletion(runId);
  
  // 3. Fetch results
  const results = await fetchDataset(datasetId);
  
  if (results.length === 0) {
    throw new Error('No results found for query: ' + searchQuery);
  }
  
  // 4. Transform to our format
  return transformPlaceData(results[0]);
}

/**
 * Scrape SERP for ranking data
 */
export async function scrapeSERP(keyword, location = 'Houston, Texas, United States') {
  if (!isConfigured) {
    throw new Error('APIFY_TOKEN not configured');
  }

  console.log(`🔍 Scraping SERP: "${keyword}"`);
  
  const actorUrlId = getActorUrlId(SERP_ACTOR);
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorUrlId}/runs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queries: keyword,
        location,
        language: 'en',
        maxPagesPerQuery: 2,
        resultsPerPage: 10,
        mobileResults: false
      })
    }
  );

  if (!runResponse.ok) {
    throw new Error('SERP scrape failed: ' + await runResponse.text());
  }

  const runData = await runResponse.json();
  const datasetId = await waitForCompletion(runData.data.id);
  const results = await fetchDataset(datasetId);
  
  return transformSERPData(results);
}

/**
 * Wait for Apify run to complete
 */
async function waitForCompletion(runId, maxAttempts = 60) {
  const actorUrlId = getActorUrlId(GOOGLE_MAPS_ACTOR);
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorUrlId}/runs/${runId}`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to check run status');
    }
    
    const data = await response.json();
    const status = data.data.status;
    
    if (status === 'SUCCEEDED') {
      return data.data.defaultDatasetId;
    }
    
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status}`);
    }
    
    // Progress indicator
    process.stdout.write('.');
    await sleep(5000); // Wait 5 seconds
  }
  
  throw new Error('Timeout waiting for Apify run');
}

/**
 * Fetch dataset from Apify
 */
async function fetchDataset(datasetId) {
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch dataset');
  }
  
  return await response.json();
}

/**
 * Transform Apify place data to our format
 */
function transformPlaceData(apifyData) {
  return {
    title: apifyData.title,
    address: apifyData.address,
    location: {
      lat: apifyData.location?.lat,
      lng: apifyData.location?.lng
    },
    description: apifyData.description || apifyData.about,
    phone: apifyData.phone,
    website: apifyData.website,
    email: apifyData.email,
    totalScore: apifyData.totalScore,
    reviewsCount: apifyData.reviewsCount,
    reviews: (apifyData.reviews || []).map(r => ({
      text: r.text,
      rating: r.stars,
      date: r.publishedAtDate
    })),
    openingHours: apifyData.openingHours,
    categories: apifyData.categories,
    images: apifyData.images,
    serviceArea: apifyData.serviceArea,
    neighborhood: apifyData.neighborhood,
    placeId: apifyData.placeId,
    url: apifyData.url,
    
    // Raw data for debugging
    _raw: apifyData
  };
}

/**
 * Transform SERP data to our format
 */
function transformSERPData(apifyResults) {
  const results = [];
  
  for (const result of apifyResults) {
    // Extract organic results
    if (result.organicResults) {
      for (const [index, item] of result.organicResults.entries()) {
        results.push({
          position: index + 1,
          title: item.title,
          url: item.url,
          description: item.description,
          type: 'organic'
        });
      }
    }
    
    // Extract local pack results
    if (result.localPack) {
      for (const [index, item] of result.localPack.places.entries()) {
        results.push({
          position: index + 1,
          title: item.title,
          url: item.url,
          address: item.address,
          rating: item.rating,
          reviews: item.reviewsCount,
          type: 'local_pack'
        });
      }
    }
  }
  
  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Apify usage stats
 */
export async function getUsageStats() {
  if (!isConfigured) {
    return null;
  }
  
  const response = await fetch(
    'https://api.apify.com/v2/users/me',
    {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    }
  );
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return {
    username: data.data.username,
    plan: data.data.plan?.planTitle,
    usage: data.data.usage
  };
}

// Test function
export async function testConnection() {
  if (!isConfigured) {
    console.log('❌ APIFY_TOKEN not set');
    return false;
  }
  
  try {
    const stats = await getUsageStats();
    console.log('✓ Apify connected');
    console.log(`  User: ${stats.username}`);
    console.log(`  Plan: ${stats.plan}`);
    return true;
  } catch (e) {
    console.log('❌ Apify connection failed:', e.message);
    return false;
  }
}
