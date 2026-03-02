#!/bin/bash
#
# Generate Dental-Specific Schema
# Usage: ./generate-dental-schema.sh [client_id] [output_dir]

CLIENT_ID=$1
OUTPUT_DIR=$2
CLIENT_FILE="../outputs/$CLIENT_ID/client.json"

if [ ! -f "$CLIENT_FILE" ]; then
  echo "Client file not found: $CLIENT_FILE"
  exit 1
fi

# Read client data
BUSINESS_NAME=$(grep -o '"businessName": "[^"]*"' "$CLIENT_FILE" | cut -d'"' -f4)
WEBSITE=$(grep -o '"website": "[^"]*"' "$CLIENT_FILE" | cut -d'"' -f4)
LOCATION=$(grep -o '"location": "[^"]*"' "$CLIENT_FILE" | cut -d'"' -f4 || echo "[LOCATION]")

mkdir -p "$OUTPUT_DIR"

# Generate Dental Business Schema
cat > "$OUTPUT_DIR/schema-dentist.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "@id": "$WEBSITE",
  "name": "$BUSINESS_NAME",
  "url": "$WEBSITE",
  "telephone": "[PHONE_NUMBER]",
  "email": "[EMAIL]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[STREET_ADDRESS]",
    "addressLocality": "[CITY]",
    "addressRegion": "[STATE]",
    "postalCode": "[ZIP_CODE]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[LATITUDE]",
    "longitude": "[LONGITUDE]"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "08:00",
      "closes": "17:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Friday",
      "opens": "08:00",
      "closes": "14:00"
    }
  ],
  "priceRange": "$$",
  "paymentAccepted": ["Cash", "Credit Card", "Dental Insurance", "CareCredit"],
  "currenciesAccepted": "USD",
  "medicalSpecialty": [
    {"@type": "MedicalSpecialty", "name": "General Dentistry"},
    {"@type": "MedicalSpecialty", "name": "Cosmetic Dentistry"},
    {"@type": "MedicalSpecialty", "name": "Dental Implants"},
    {"@type": "MedicalSpecialty", "name": "Emergency Dentistry"}
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Dental Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Dental Implants",
          "description": "Permanent tooth replacement solution"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Invisalign",
          "description": "Clear aligner orthodontic treatment"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Teeth Whitening",
          "description": "Professional in-office whitening"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Emergency Dental Care",
          "description": "Same-day emergency appointments"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "[NUMBER_OF_REVIEWS]"
  }
}
EOF

# Generate Dental Implant Service Schema
cat > "$OUTPUT_DIR/schema-service-implants.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "Dental Implants in [CITY] | $BUSINESS_NAME",
  "description": "Expert dental implant services in [CITY]. Restore your smile with permanent tooth replacement. Free consultation available.",
  "mainEntity": {
    "@type": "MedicalProcedure",
    "name": "Dental Implant Surgery",
    "procedureType": "Surgical",
    "followup": "3-6 months healing period with check-ups every 4-6 weeks",
    "preparation": [
      "Comprehensive oral exam",
      "3D CT scan imaging",
      "Treatment planning session",
      "Medical history review"
    ],
    "howPerformed": [
      "Titanium implant placed in jawbone",
      "Healing period for osseointegration",
      "Abutment attachment",
      "Custom crown placement"
    ]
  },
  "mainEntityOfPage": {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much do dental implants cost in [CITY]?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Dental implants in [CITY] typically cost between \\$3,000 and \\$5,000 per implant, including the implant post, abutment, and crown. $BUSINESS_NAME offers financing options with 0% APR available."
        }
      },
      {
        "@type": "Question",
        "name": "How long do dental implants last?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "With proper care, dental implants can last a lifetime. The titanium implant itself can last 25+ years, while the crown typically lasts 10-15 years before needing replacement."
        }
      },
      {
        "@type": "Question",
        "name": "Is dental implant surgery painful?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most patients experience minimal discomfort during dental implant surgery. We use local anesthesia and offer sedation options. Post-operative pain is typically managed with over-the-counter pain relievers."
        }
      }
    ]
  }
}
EOF

# Generate Dentist Person Schema
cat > "$OUTPUT_DIR/schema-dentist-person.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "Dr. [FIRST_NAME] [LAST_NAME]",
  "jobTitle": "Lead Dentist",
  "worksFor": {
    "@type": "Dentist",
    "name": "$BUSINESS_NAME",
    "url": "$WEBSITE"
  },
  "alumniOf": {
    "@type": "CollegeOrUniversity",
    "name": "[DENTAL_SCHOOL_NAME]"
  },
  "credential": [
    "DDS",
    "[ADDITIONAL_CREDENTIALS]"
  ],
  "memberOf": [
    {
      "@type": "Organization",
      "name": "American Dental Association"
    },
    {
      "@type": "Organization",
      "name": "[STATE] Dental Association"
    }
  ],
  "knowsAbout": [
    "Dental Implants",
    "Cosmetic Dentistry",
    "Emergency Dentistry",
    "Sedation Dentistry",
    "Invisalign"
  ],
  "description": "Dr. [LAST_NAME] is a board-certified dentist with [X]+ years of experience serving the [CITY] community."
}
EOF

# Generate Dental FAQ Schema
cat > "$OUTPUT_DIR/schema-faq-dental.json" << EOF
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you accept dental insurance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, $BUSINESS_NAME accepts most major dental insurance plans including Delta Dental, Cigna, Aetna, and MetLife. We also offer in-house membership plans for uninsured patients."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer emergency dental services?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we provide same-day emergency dental appointments for urgent issues like severe toothaches, broken teeth, and dental trauma. Call us at [PHONE] for immediate assistance."
      }
    },
    {
      "@type": "Question",
      "name": "How often should I visit the dentist?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We recommend visiting the dentist every 6 months for routine check-ups and professional cleanings. However, patients with certain conditions may need more frequent visits."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer sedation dentistry?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer various sedation options including nitrous oxide (laughing gas), oral sedation, and IV sedation for patients with dental anxiety or undergoing complex procedures."
      }
    }
  ]
}
EOF

echo "✅ Dental Schema Templates Generated"
echo ""
echo "Files created:"
ls -1 "$OUTPUT_DIR/schema-*.json"
