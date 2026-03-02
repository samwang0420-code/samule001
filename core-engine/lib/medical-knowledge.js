/**
 * Medical Aesthetic & Dental Knowledge Graph
 * 
 * Ontology for Plastic Surgery, Med Spas, and Dental Practices
 */

export const MEDICAL_ONTOLOGY = {
  // Practice Types
  practiceTypes: {
    plasticSurgery: {
      name: 'Plastic Surgery Center',
      procedures: {
        surgical: [
          'Rhinoplasty', 'Breast Augmentation', 'Liposuction', 'Tummy Tuck',
          'Facelift', 'Blepharoplasty', 'Brazilian Butt Lift', 'Mommy Makeover'
        ],
        nonSurgical: [
          'Botox', 'Dermal Fillers', 'Kybella', 'Liquid Facelift'
        ]
      },
      certifications: ['ABPS', 'ASPS Member'],
      keyTerms: ['Board Certified', 'Plastic Surgeon', 'Cosmetic Surgery']
    },
    
    medSpa: {
      name: 'Medical Spa / Aesthetic Clinic',
      procedures: {
        injectables: [
          'Botox', 'Dysport', 'Xeomin', 'Juvederm', 'Restylane', 'Sculptra'
        ],
        laser: [
          'Laser Hair Removal', 'IPL Photofacial', 'Laser Skin Resurfacing',
          'CoolSculpting', 'Emsculpt', 'Morpheus8'
        ],
        skin: [
          'Chemical Peel', 'Microneedling', 'Hydrafacial', 'PRP Facial',
          'Medical Grade Facials'
        ]
      },
      providers: ['MD', 'DO', 'NP', 'PA', 'RN'],
      keyTerms: ['Med Spa', 'Aesthetic Medicine', 'Non-surgical']
    },
    
    dermatology: {
      name: 'Dermatology / Cosmetic Dermatology',
      procedures: {
        medical: [
          'Acne Treatment', 'Eczema Treatment', 'Skin Cancer Screening',
          'Mole Removal', 'Psoriasis Treatment'
        ],
        cosmetic: [
          'Botox', 'Fillers', 'Laser Treatments', 'Chemical Peels',
          'Cosmetic Dermatology'
        ]
      },
      certifications: ['Board Certified Dermatologist', 'FAAD'],
      keyTerms: ['Dermatologist', 'Skin Care', 'Medical Dermatology']
    },
    
    dentist: {
      name: 'Dental Practice',
      specialties: {
        general: {
          name: 'General Dentistry',
          services: [
            'Teeth Cleaning', 'Dental Exam', 'Fillings', 'Crowns',
            'Bridges', 'Root Canal', 'Tooth Extraction'
          ]
        },
        cosmetic: {
          name: 'Cosmetic Dentistry',
          services: [
            'Teeth Whitening', 'Veneers', 'Dental Bonding',
            'Smile Makeover', 'Invisalign'
          ]
        },
        orthodontics: {
          name: 'Orthodontics',
          services: [
            'Braces', 'Invisalign', 'Clear Aligners', 'Retainers'
          ]
        },
        implants: {
          name: 'Dental Implants',
          services: [
            'Single Tooth Implant', 'All-on-4', 'Implant Supported Dentures'
          ]
        },
        emergency: {
          name: 'Emergency Dentistry',
          services: [
            'Toothache Relief', 'Broken Tooth Repair', 'Knocked Out Tooth',
            'Same Day Emergency Appointments'
          ]
        }
      },
      certifications: ['ADA Member', 'Academy of General Dentistry'],
      keyTerms: ['Dentist', 'Dental Care', 'Oral Health']
    },
    
    orthodontist: {
      name: 'Orthodontic Practice',
      treatments: [
        'Traditional Braces', 'Ceramic Braces', 'Lingual Braces',
        'Invisalign', 'ClearCorrect', 'Spark Aligners'
      ],
      patientTypes: ['Children', 'Teens', 'Adults'],
      keyTerms: ['Orthodontist', 'Braces', 'Invisalign Provider']
    }
  },
  
  // Key Products/Treatments
  treatments: {
    botox: {
      name: 'Botox / Neuromodulators',
      brands: ['Botox Cosmetic', 'Dysport', 'Xeomin', 'Jeuveau'],
      areas: ['Forehead Lines', 'Crow\'s Feet', 'Frown Lines', 'Bunny Lines'],
      duration: '3-4 months',
      priceRange: '$200-$600'
    },
    
    fillers: {
      name: 'Dermal Fillers',
      brands: ['Juvederm', 'Restylane', 'Radiesse', 'Sculptra', 'Belotero'],
      areas: ['Lips', 'Cheeks', 'Nasolabial Folds', 'Under Eyes', 'Jawline'],
      duration: '6-18 months',
      priceRange: '$600-$1,500 per syringe'
    },
    
    laser: {
      name: 'Laser Treatments',
      types: [
        { name: 'Laser Hair Removal', areas: 'Face, Body, Brazilian' },
        { name: 'IPL Photofacial', concerns: 'Sun Damage, Age Spots, Rosacea' },
        { name: 'Fractional Laser', concerns: 'Acne Scars, Wrinkles, Texture' },
        { name: 'Tattoo Removal', method: 'Q-Switched or PicoSure Laser' }
      ]
    },
    
    bodyContouring: {
      name: 'Body Contouring',
      options: [
        { name: 'CoolSculpting', technology: 'Cryolipolysis', downtime: 'None' },
        { name: 'Emsculpt', technology: 'HIFEM', benefit: 'Muscle Building + Fat Reduction' },
        { name: 'SculpSure', technology: 'Laser Lipolysis', sessions: '1-2' }
      ]
    },
    
    skinTreatments: {
      name: 'Skin Treatments',
      options: [
        { name: 'Microneedling', benefits: 'Collagen, Acne Scars, Texture' },
        { name: 'Chemical Peel', types: 'Superficial, Medium, Deep' },
        { name: 'Hydrafacial', benefit: 'Deep Cleansing, Hydration' },
        { name: 'PRP Facial', aka: 'Vampire Facial', benefits: 'Rejuvenation' }
      ]
    }
  },
  
  // Certifications & Credentials
  credentials: {
    medical: {
      ABPS: { fullName: 'American Board of Plastic Surgery', level: 'Gold Standard' },
      ABFCS: { fullName: 'American Board of Facial Cosmetic Surgery', level: 'Specialized' },
      ABMS: { fullName: 'American Board of Medical Specialties', level: 'Recognized' },
      StateMedicalBoard: { level: 'Required' }
    },
    dental: {
      DDS: { fullName: 'Doctor of Dental Surgery' },
      DMD: { fullName: 'Doctor of Dental Medicine' },
      ADA: { fullName: 'American Dental Association', type: 'Membership' },
      InvisalignProvider: { levels: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] }
    },
    aesthetic: {
      CANS: { fullName: 'Certified Aesthetic Nurse Specialist' },
      NCEC: { fullName: 'National Certification in Aesthetic Medicine' }
    }
  },
  
  // Patient Concerns
  patientConcerns: {
    aesthetic: [
      'Aging', 'Wrinkles', 'Fine Lines', 'Volume Loss', 'Skin Laxity',
      'Acne Scars', 'Sun Damage', 'Uneven Skin Tone', 'Double Chin',
      'Thin Lips', 'Hollow Cheeks', 'Under Eye Bags', 'Cellulite'
    ],
    dental: [
      'Crooked Teeth', 'Gaps', 'Yellow Teeth', 'Missing Teeth',
      'Tooth Pain', 'Bleeding Gums', 'Bad Breath', 'Wisdom Teeth'
    ]
  },
  
  // Local Context (Medical Districts)
  localContext: {
    houston: {
      medicalDistricts: [
        'Texas Medical Center',
        'Memorial Hermann',
        'Methodist Hospital Area',
        'The Galleria Medical'
      ],
      affluentAreas: [
        'River Oaks', 'Memorial', 'Tanglewood', 'Bellaire',
        'West University', 'Sugar Land', 'The Woodlands'
      ],
      landmarks: [
        'The Galleria', 'Memorial City Mall', 'Highland Village'
      ]
    }
  }
};

/**
 * Get related entities for medical/aesthetic content
 */
export function getMedicalEntities(topic) {
  const entities = [];
  const lowerTopic = topic.toLowerCase();
  
  // Check treatments
  for (const [key, data] of Object.entries(MEDICAL_ONTOLOGY.treatments)) {
    if (lowerTopic.includes(key) || lowerTopic.includes(data.name.toLowerCase())) {
      entities.push(data.name);
      if (data.brands) entities.push(...data.brands);
      if (data.areas) entities.push(...data.areas);
    }
  }
  
  // Check practice types
  for (const [key, data] of Object.entries(MEDICAL_ONTOLOGY.practiceTypes)) {
    if (lowerTopic.includes(key) || lowerTopic.includes(data.name.toLowerCase())) {
      entities.push(data.name);
      if (data.keyTerms) entities.push(...data.keyTerms);
    }
  }
  
  return [...new Set(entities)];
}

/**
 * Generate medical-specific Schema
 */
export function generateMedicalSchema(practiceData, services = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalBusiness",
        "@id": `${practiceData.website}#medical-business`,
        "name": practiceData.name,
        "description": practiceData.description,
        "url": practiceData.website,
        "telephone": practiceData.phone,
        "email": practiceData.email,
        "medicalSpecialty": services.map(s => ({
          "@type": "MedicalSpecialty",
          "name": s
        })),
        "areaServed": {
          "@type": "City",
          "name": practiceData.city || "Houston"
        }
      },
      {
        "@type": "Physician",
        "@id": `${practiceData.website}#physician`,
        "name": practiceData.doctorName || practiceData.name,
        "medicalSpecialty": services.slice(0, 3),
        "worksFor": { "@id": `${practiceData.website}#medical-business` },
        "credential": practiceData.credentials?.join(', ')
      }
    ]
  };
}

export default {
  MEDICAL_ONTOLOGY,
  getMedicalEntities,
  generateMedicalSchema
};
