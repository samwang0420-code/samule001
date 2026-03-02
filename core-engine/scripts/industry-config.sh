#!/bin/bash
#
# Industry-Specific Analysis Configuration
# This file contains industry-specific settings for the analysis engine

# Medical Spa Industry Settings
MEDICAL_SPA_KEYWORDS=(
  "botox [location]"
  "fillers [location]"
  "medical spa [location]"
  "med spa near me"
  "anti aging [location]"
  "laser hair removal [location]"
  "microneedling [location]"
  "chemical peel [location]"
  "prp treatment [location]"
  "hydrafacial [location]"
)

MEDICAL_SPA_SERVICES=(
  "Botox Injections"
  "Dermal Fillers"
  "Laser Hair Removal"
  "Microneedling"
  "Chemical Peels"
  "Hydrafacial"
  "PRP Therapy"
  "CoolSculpting"
  "Skin Rejuvenation"
  "Acne Treatment"
)

MEDICAL_SPA_SCHEMA="MedicalBusiness"

# Dental Industry Settings
DENTAL_KEYWORDS=(
  "dentist [location]"
  "emergency dentist [location]"
  "dental implants [location]"
  "invisalign [location]"
  "teeth whitening [location]"
  "pediatric dentist [location]"
  "cosmetic dentist [location]"
  "root canal [location]"
  "wisdom teeth removal [location]"
  "dental crowns [location]"
)

DENTAL_SERVICES=(
  "General Dentistry"
  "Dental Implants"
  "Cosmetic Dentistry"
  "Invisalign"
  "Teeth Whitening"
  "Pediatric Dentistry"
  "Emergency Dentistry"
  "Root Canal Therapy"
  "Wisdom Teeth Removal"
  "Dental Crowns"
  "Dental Veneers"
  "Sedation Dentistry"
)

DENTAL_SCHEMA="Dentist"

# Dermatology Industry Settings
DERMATOLOGY_KEYWORDS=(
  "dermatologist [location]"
  "skin doctor [location]"
  "acne treatment [location]"
  "skin cancer screening [location]"
  "mohs surgery [location]"
  "psoriasis treatment [location]"
  "eczema treatment [location]"
  "botox dermatologist [location]"
  "laser skin treatment [location]"
)

DERMATOLOGY_SERVICES=(
  "Medical Dermatology"
  "Cosmetic Dermatology"
  "Skin Cancer Treatment"
  "Mohs Surgery"
  "Acne Treatment"
  "Eczema Treatment"
  "Psoriasis Treatment"
  "Laser Treatments"
  "Botox & Fillers"
  "Skin Cancer Screening"
)

DERMATOLOGY_SCHEMA="Physician"

# Plastic Surgery Industry Settings
PLASTIC_SURGERY_KEYWORDS=(
  "plastic surgeon [location]"
  "cosmetic surgery [location]"
  "breast augmentation [location]"
  "liposuction [location]"
  "tummy tuck [location]"
  "facelift [location]"
  "rhinoplasty [location]"
  "mommy makeover [location]"
  "brazilian butt lift [location]"
)

PLASTIC_SURGERY_SERVICES=(
  "Breast Augmentation"
  "Liposuction"
  "Tummy Tuck"
  "Facelift"
  "Rhinoplasty"
  "Mommy Makeover"
  "Brazilian Butt Lift"
  "Eyelid Surgery"
  "Botox & Fillers"
  "Non-Surgical Procedures"
)

PLASTIC_SURGERY_SCHEMA="Physician"

# Function to get industry-specific settings
get_industry_settings() {
  local industry=$1
  local location=$2
  
  case $industry in
    medical-spa)
      echo "keywords:${MEDICAL_SPA_KEYWORDS[*]}"
      echo "services:${MEDICAL_SPA_SERVICES[*]}"
      echo "schema:$MEDICAL_SPA_SCHEMA"
      ;;
    dentistry|dental)
      echo "keywords:${DENTAL_KEYWORDS[*]}"
      echo "services:${DENTAL_SERVICES[*]}"
      echo "schema:$DENTAL_SCHEMA"
      ;;
    dermatology)
      echo "keywords:${DERMATOLOGY_KEYWORDS[*]}"
      echo "services:${DERMATOLOGY_SERVICES[*]}"
      echo "schema:$DERMATOLOGY_SCHEMA"
      ;;
    plastic-surgery)
      echo "keywords:${PLASTIC_SURGERY_KEYWORDS[*]}"
      echo "services:${PLASTIC_SURGERY_SERVICES[*]}"
      echo "schema:$PLASTIC_SURGERY_SCHEMA"
      ;;
    *)
      echo "keywords:local service [location],best [location]"
      echo "services:General Services"
      echo "schema:LocalBusiness"
      ;;
  esac
}

# Export functions
export -f get_industry_settings
