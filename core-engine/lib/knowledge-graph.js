/**
 * Immigration Law Knowledge Graph
 * 
 * Builds and manages legal ontology for immigration law
 * Used for dynamic Schema generation and content optimization
 */

// Immigration Law Ontology
export const IMMIGRATION_ONTOLOGY = {
  // Visa Categories
  visas: {
    employment: {
      h1b: {
        name: 'H-1B Specialty Occupation',
        forms: ['I-129', 'I-907'],
        requirements: ['Bachelor degree', 'Job offer', 'Labor Condition Application'],
        processingTime: '6-8 months',
        validity: '3 years, extendable to 6',
        relatedEntities: ['USCIS', 'DOL', 'LCA', 'Premium Processing']
      },
      l1: {
        name: 'L-1 Intracompany Transferee',
        forms: ['I-129'],
        requirements: ['1 year employment abroad', 'Managerial/Specialized knowledge'],
        processingTime: '2-4 months',
        validity: 'L-1A: 7 years, L-1B: 5 years',
        relatedEntities: ['USCIS', 'Multinational company']
      },
      o1: {
        name: 'O-1 Extraordinary Ability',
        forms: ['I-129'],
        requirements: ['Extraordinary ability', 'National/international acclaim'],
        processingTime: '2-4 months',
        validity: '3 years, unlimited extensions',
        relatedEntities: ['USCIS', 'Peer group consultation']
      },
      eb1: {
        name: 'EB-1 Priority Workers',
        forms: ['I-140'],
        subcategories: ['EB-1A: Extraordinary Ability', 'EB-1B: Outstanding Researcher', 'EB-1C: Multinational Manager'],
        requirements: ['Top of field', 'Permanent job offer (for EB-1B/C)'],
        processingTime: '8-12 months',
        relatedEntities: ['USCIS', 'Priority Date', 'Visa Bulletin']
      },
      eb2: {
        name: 'EB-2 Advanced Degree/Exceptional Ability',
        forms: ['I-140', 'PERM'],
        requirements: ['Masters degree OR 5 years experience', 'Labor Certification'],
        processingTime: '12-18 months',
        relatedEntities: ['USCIS', 'DOL', 'PERM', 'National Interest Waiver']
      },
      eb3: {
        name: 'EB-3 Skilled/Professional Workers',
        forms: ['I-140', 'PERM'],
        requirements: ['Bachelor degree OR 2 years training', 'Labor Certification'],
        processingTime: '12-24 months',
        relatedEntities: ['USCIS', 'DOL', 'PERM', 'Priority Date']
      }
    },
    
    family: {
      immediateRelative: {
        name: 'Immediate Relative Immigrant Visa',
        categories: ['Spouse of US Citizen', 'Unmarried child under 21', 'Parent of US Citizen (21+)'],
        forms: ['I-130', 'I-485'],
        processingTime: '12-18 months',
        quota: 'Unlimited',
        relatedEntities: ['USCIS', 'Consular Processing', 'Adjustment of Status']
      },
      familyPreference: {
        name: 'Family Preference Immigrant Visa',
        categories: ['F1: Unmarried children of US citizens', 'F2A: Spouses/children of LPR', 'F2B: Unmarried children of LPR', 'F3: Married children of US citizens', 'F4: Siblings of US citizens'],
        forms: ['I-130'],
        processingTime: '2-15 years (by category)',
        quota: 'Limited',
        relatedEntities: ['USCIS', 'Priority Date', 'Visa Bulletin', 'National Visa Center']
      },
      k1: {
        name: 'K-1 Fiancé(e) Visa',
        forms: ['I-129F', 'DS-160'],
        requirements: ['Intent to marry within 90 days', 'Met in person within 2 years'],
        processingTime: '6-9 months',
        relatedEntities: ['USCIS', 'NVC', 'US Embassy']
      }
    },
    
    humanitarian: {
      asylum: {
        name: 'Asylum',
        forms: ['I-589'],
        requirements: ['Well-founded fear of persecution', 'Based on race/religion/nationality/political opinion/membership'],
        deadline: 'Within 1 year of arrival (exceptions apply)',
        processingTime: '6 months - 5 years',
        relatedEntities: ['USCIS', 'EOIR', 'Immigration Court']
      },
      uVisa: {
        name: 'U Visa (Crime Victims)',
        forms: ['I-918'],
        requirements: ['Victim of qualifying crime', 'Helpful to law enforcement', 'Suffered substantial harm'],
        processingTime: '4-6 years (high backlog)',
        relatedEntities: ['USCIS', 'Law enforcement certification']
      },
      tVisa: {
        name: 'T Visa (Trafficking Victims)',
        forms: ['I-914'],
        requirements: ['Victim of severe trafficking', 'Present in US due to trafficking', 'Complied with reasonable requests'],
        processingTime: '12-18 months',
        relatedEntities: ['USCIS', 'Department of Health and Human Services']
      }
    }
  },
  
  // Key Entities
  entities: {
    agencies: {
      USCIS: {
        fullName: 'U.S. Citizenship and Immigration Services',
        role: 'Adjudicates immigration benefits',
        website: 'uscis.gov'
      },
      DOL: {
        fullName: 'Department of Labor',
        role: 'Labor certification for employment visas',
        website: 'dol.gov'
      },
      DOS: {
        fullName: 'Department of State',
        role: 'Consular processing, visa issuance',
        website: 'travel.state.gov'
      },
      EOIR: {
        fullName: 'Executive Office for Immigration Review',
        role: 'Immigration courts, removal proceedings',
        website: 'justice.gov/eoir'
      },
      NVC: {
        fullName: 'National Visa Center',
        role: 'Pre-processing immigrant visa cases',
        website: 'nvc.state.gov'
      }
    },
    
    keyTerms: {
      priorityDate: {
        definition: 'Date when labor certification or I-130 was filed',
        importance: 'Determines place in visa queue',
        related: ['Visa Bulletin', 'Final Action Date', 'Dates for Filing']
      },
      perm: {
        fullName: 'Program Electronic Review Management',
        purpose: 'Labor certification for EB-2/EB-3',
        process: 'Recruitment, prevailing wage determination',
        timeline: '12-18 months'
      },
      laborConditionApplication: {
        abbreviation: 'LCA',
        purpose: 'Protect US workers, ensure fair wages for H-1B',
        timeline: '7-10 days'
      },
      adjustmentOfStatus: {
        abbreviation: 'AOS',
        purpose: 'Apply for green card while in US',
        form: 'I-485',
        alternative: 'Consular Processing (DS-260)'
      }
    }
  },
  
  // Houston-specific Context
  localContext: {
    courts: [
      { name: 'Houston Immigration Court', address: '1919 Smith St, Houston, TX' },
      { name: 'USCIS Houston Field Office', address: '12650 Greenspoint Dr, Houston, TX' }
    ],
    landmarks: [
      'Texas Medical Center',
      'Energy Corridor',
      'Downtown Houston',
      'Galleria Area'
    ],
    industries: [
      'Energy/Oil & Gas',
      'Healthcare/Medical',
      'Technology',
      'Aerospace'
    ]
  }
};

/**
 * Get related entities for a given topic
 */
export function getRelatedEntities(topic) {
  const entities = [];
  const lowerTopic = topic.toLowerCase();
  
  // Check visas
  for (const [category, visas] of Object.entries(IMMIGRATION_ONTOLOGY.visas)) {
    for (const [visaType, visaData] of Object.entries(visas)) {
      if (lowerTopic.includes(visaType) || lowerTopic.includes(visaData.name.toLowerCase())) {
        entities.push(...visaData.relatedEntities);
      }
    }
  }
  
  // Check key terms
  for (const [term, data] of Object.entries(IMMIGRATION_ONTOLOGY.entities.keyTerms)) {
    if (lowerTopic.includes(term.toLowerCase())) {
      entities.push(term);
      if (data.related) entities.push(...data.related);
    }
  }
  
  return [...new Set(entities)]; // Remove duplicates
}

/**
 * Generate Schema.org markup with knowledge graph entities
 */
export function generateEnhancedSchema(lawFirmData, practiceAreas = []) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": lawFirmData.name,
    "areaServed": {
      "@type": "City",
      "name": "Houston",
      "containsPlace": IMMIGRATION_ONTOLOGY.localContext.courts.map(c => ({
        "@type": "GovernmentBuilding",
        "name": c.name,
        "address": c.address
      }))
    },
    "knowsAbout": practiceAreas.map(area => {
      const visa = findVisaByKeyword(area);
      if (visa) {
        return {
          "@type": "Thing",
          "name": visa.name,
          "description": `Immigration visa category: ${visa.name}`,
          "identifier": Object.keys(IMMIGRATION_ONTOLOGY.visas).find(k => 
            IMMIGRATION_ONTOLOGY.visas[k][Object.keys(IMMIGRATION_ONTOLOGY.visas[k]).find(v => 
              IMMIGRATION_ONTOLOGY.visas[k][v].name === visa.name
            )]
          )
        };
      }
      return { "@type": "Thing", "name": area };
    }),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Immigration Legal Services",
      "itemListElement": practiceAreas.map((area, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": area,
            "provider": { "@type": "LegalService", "name": lawFirmData.name }
          }
        }
      }))
    }
  };
  
  return schema;
}

function findVisaByKeyword(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  
  for (const category of Object.values(IMMIGRATION_ONTOLOGY.visas)) {
    for (const [visaType, visaData] of Object.entries(category)) {
      if (lowerKeyword.includes(visaType.toLowerCase()) ||
          lowerKeyword.includes(visaData.name.toLowerCase())) {
        return visaData;
      }
    }
  }
  return null;
}

/**
 * Generate content with entity enrichment
 */
export function enrichContent(content, targetEntities = []) {
  let enriched = content;
  const entities = targetEntities.length > 0 
    ? targetEntities 
    : extractEntitiesFromContent(content);
  
  // Add entity definitions
  const definitions = entities.map(entity => {
    const def = getEntityDefinition(entity);
    return def ? `<span itemscope itemtype="https://schema.org/Thing" itemprop="mentions">
      <meta itemprop="name" content="${entity}" />
      <meta itemprop="description" content="${def}" />
    </span>` : '';
  }).filter(Boolean);
  
  return {
    content: enriched,
    entities: entities,
    schemaMarkup: definitions.join('\n'),
    entityDensity: entities.length / content.split(/\s+/).length * 100
  };
}

function getEntityDefinition(entity) {
  // Check key terms
  const term = IMMIGRATION_ONTOLOGY.entities.keyTerms[entity.toLowerCase()];
  if (term) return term.definition || term.purpose || term.fullName;
  
  // Check agencies
  const agency = IMMIGRATION_ONTOLOGY.entities.agencies[entity.toUpperCase()];
  if (agency) return agency.role;
  
  return null;
}

function extractEntitiesFromContent(content) {
  const lowerContent = content.toLowerCase();
  const found = [];
  
  // Check for visa mentions
  for (const category of Object.values(IMMIGRATION_ONTOLOGY.visas)) {
    for (const [visaType, visaData] of Object.entries(category)) {
      if (lowerContent.includes(visaType.toLowerCase()) ||
          lowerContent.includes(visaData.name.toLowerCase())) {
        found.push(visaType.toUpperCase());
      }
    }
  }
  
  // Check for key terms
  for (const term of Object.keys(IMMIGRATION_ONTOLOGY.entities.keyTerms)) {
    if (lowerContent.includes(term.toLowerCase())) {
      found.push(term);
    }
  }
  
  return [...new Set(found)];
}

export default {
  IMMIGRATION_ONTOLOGY,
  getRelatedEntities,
  generateEnhancedSchema,
  enrichContent
};
