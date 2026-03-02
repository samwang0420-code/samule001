/**
 * Medical Content Generator
 * 
 * Generates optimized content for Medical Aesthetic & Dental practices
 */

import * as medicalKnowledge from './medical-knowledge.js';
import * as medicalCitation from './medical-citation.js';

/**
 * Generate medical practice location page
 */
export function generateMedicalLocationPage(practiceData, services = []) {
  const location = practiceData.city || 'Houston';
  const practiceName = practiceData.name;
  const specialty = practiceData.specialty || 'Medical Aesthetics';
  
  const content = {
    title: `${practiceName} | ${specialty} in ${location}`,
    metaDescription: `Top-rated ${specialty.toLowerCase()} in ${location}. Board-certified providers specializing in ${services.slice(0, 3).join(', ')}. Free consultations available.`,
    
    hero: generateMedicalHero(practiceName, location, specialty, practiceData),
    
    introduction: generateMedicalIntroduction(practiceName, location, specialty, services, practiceData),
    
    services: generateServicesSection(services, specialty),
    
    credentials: generateCredentialsSection(practiceData),
    
    beforeAfter: generateBeforeAfterSection(),
    
    reviews: generateReviewsSection(),
    
    faq: generateMedicalFAQ(services, practiceName),
    
    cta: generateMedicalCTA(practiceName, practiceData)
  };
  
  // Check citation probability
  const fullContent = Object.values(content).filter(v => typeof v === 'string').join(' ');
  content.citationScore = medicalCitation.calculateMedicalCitationProbability(fullContent);
  
  return content;
}

function generateMedicalHero(practiceName, location, specialty, data) {
  return `
${practiceName}: Premier ${specialty} in ${location}

Board-certified specialists providing exceptional ${specialty.toLowerCase()} results. 
${data.yearsExperience || 'Over 10 years'} of experience. Thousands of satisfied patients. 
Free consultations. Flexible financing available.

📞 Call now to schedule your consultation
🌟 Rated 5 stars by ${data.reviewCount || '500+'} patients
  `.trim();
}

function generateMedicalIntroduction(practiceName, location, specialty, services, data) {
  const topServices = services.slice(0, 4).join(', ');
  
  return `
## Expert ${specialty} Services in ${location}

Welcome to ${practiceName}, ${location}'s premier destination for ${specialty.toLowerCase()}. 
Our board-certified providers specialize in ${topServices}, delivering natural-looking 
results that enhance your confidence.

### Why Choose ${practiceName}

✓ **Board-Certified Providers** - ${data.credentials?.join(', ') || 'ABPS Certified'}
✓ **Advanced Technology** - State-of-the-art equipment and techniques  
✓ **Personalized Care** - Customized treatment plans for every patient
✓ **Proven Results** - ${data.yearsExperience || '10+'} years of excellence
✓ **Patient Safety** - FDA-approved treatments in a comfortable setting

### Our Services

${services.map(service => `- ${service}`).join('\n')}

Whether you're seeking subtle enhancements or transformative results, our 
${location} team is dedicated to helping you look and feel your best.
  `.trim();
}

function generateServicesSection(services, specialty) {
  const serviceDetails = {
    'Botox': {
      description: 'Smooth fine lines and wrinkles',
      benefits: ['FDA-approved', 'Quick 15-minute treatment', 'No downtime', 'Results in 3-7 days'],
      price: '$200-$600'
    },
    'Dermal Fillers': {
      description: 'Restore volume and contour',
      benefits: ['Instant results', 'Natural-looking', 'Long-lasting', 'Reversible'],
      price: '$600-$1,500'
    },
    'Laser Hair Removal': {
      description: 'Permanent hair reduction',
      benefits: ['Safe for all skin types', 'Fast treatments', 'Permanent results', 'No more shaving'],
      price: '$150-$500 per session'
    },
    'CoolSculpting': {
      description: 'Non-surgical fat reduction',
      benefits: ['No surgery', 'No downtime', 'Permanent fat cell elimination', 'FDA-cleared'],
      price: '$600-$1,200 per area'
    },
    'Invisalign': {
      description: 'Clear aligners for straighter teeth',
      benefits: ['Nearly invisible', 'Removable', 'Comfortable', 'Faster than braces'],
      price: '$3,000-$8,000'
    },
    'Teeth Whitening': {
      description: 'Professional whitening',
      benefits: ['Immediate results', 'Safe for enamel', 'Long-lasting', 'Custom treatment'],
      price: '$300-$800'
    }
  };
  
  return `
## Our ${specialty} Services

${services.map(service => {
  const details = serviceDetails[service] || { 
    description: service, 
    benefits: ['Consultation required'],
    price: 'Contact for pricing'
  };
  return `### ${service}

${details.description}.

**Benefits:**
${details.benefits.map(b => `- ${b}`).join('\n')}

**Starting at:** ${details.price}`;
}).join('\n\n')}
  `.trim();
}

function generateCredentialsSection(data) {
  return `
## Credentials & Expertise

### ${data.doctorName || 'Our Lead Provider'}

${data.credentials?.map(c => `- ${c}`).join('\n') || '- Board Certified'}

**Education & Training:**
- Medical Degree from ${data.medicalSchool || 'Top Medical School'}
- Residency at ${data.residency || 'Prestigious Institution'}
- ${data.yearsExperience || '10+'} years of specialized experience
- Member of ${data.memberships?.join(', ') || 'American Medical Association'}

**Awards & Recognition:**
${data.awards?.map(a => `- ${a}`).join('\n') || '- Top Doctor Award'}
  `.trim();
}

function generateBeforeAfterSection() {
  return `
## Real Results: Before & After

See the transformative results our patients have achieved. Every treatment 
is customized to meet individual goals and enhance natural beauty.

**Our Promise:**
- Real patient photos (never stock images)
- Consistent lighting and angles
- Results you can expect

[View Gallery - Link to before/after photo gallery]

*Individual results may vary. Schedule a consultation to discuss your goals.*
  `.trim();
}

function generateReviewsSection() {
  return `
## Patient Reviews

⭐⭐⭐⭐⭐ **"Exceeded my expectations!"**
"The staff was incredibly professional and made me feel comfortable throughout 
the entire process. My results look completely natural." - Sarah M.

⭐⭐⭐⭐⭐ **"Best decision I ever made"**
"After researching multiple providers, I chose this practice and couldn't be 
happier. The attention to detail is unmatched." - Jennifer K.

⭐⭐⭐⭐⭐ **"Professional and caring"**
"They took time to understand exactly what I wanted and delivered perfect results. 
Highly recommend!" - Amanda R.

**Read more reviews on Google** [Link]
  `.trim();
}

function generateMedicalFAQ(services, practiceName) {
  return `
## Frequently Asked Questions

**Q: Is there a consultation fee?**
A: We offer complimentary consultations for all new patients. During your 
consultation, we'll discuss your goals and create a customized treatment plan.

**Q: How long do results last?**
A: Treatment longevity varies by service. Botox typically lasts 3-4 months, 
filler results can last 6-18 months, and laser hair removal is permanent. 
We'll discuss expected duration during your consultation.

**Q: Is it safe?**
A: Absolutely. We only use FDA-approved treatments and products. Our 
board-certified providers have extensive training and prioritize patient 
safety above all else.

**Q: What is the downtime?**
A: Most of our treatments have minimal to no downtime. You can typically 
return to normal activities immediately after Botox or fillers. We'll provide 
specific aftercare instructions for your treatment.

**Q: Do you offer financing?**
A: Yes! We offer flexible financing options to make your desired treatments 
accessible. Ask us about payment plans during your consultation.

**Q: How do I prepare for my appointment?**
A: Preparation varies by treatment. Generally, avoid blood thinners and alcohol 
24 hours before injectables. We'll provide detailed pre-treatment instructions 
when you book.
  `.trim();
}

function generateMedicalCTA(practiceName, data) {
  return `
## Schedule Your Free Consultation

Ready to enhance your natural beauty? Contact ${practiceName} today for a 
complimentary consultation with our expert team.

📞 **Call ${data.phone || '(713) 555-0123'}**

📍 **Location:** ${data.address || 'Conveniently located in Houston, TX'}

⏰ **Hours:** Monday-Friday 9am-6pm, Saturday 10am-4pm

### What to Expect

1. **Free Consultation** - Discuss your goals with our experts
2. **Customized Plan** - Receive a personalized treatment recommendation  
3. **Treatment Day** - Experience exceptional care and results
4. **Follow-Up** - We monitor your results and satisfaction

**Financing Available** - Ask about our payment plans

*Disclaimer: This website is for informational purposes only and does not 
constitute medical advice. Individual results may vary. Consultation required 
to determine appropriate treatments.*
  `.trim();
}

/**
 * Generate GMB posts for medical practice
 */
export function generateMedicalGMBPost(postType) {
  const posts = {
    promotion: {
      title: 'Spring Special: Botox $199',
      content: `🌸 Spring Refresh Special! 🌸

Botox just $199 (regular $350)
Limited time offer - Book now!

✨ Smooth fine lines
✨ Quick 15-minute treatment  
✨ No downtime
✨ Results in 3-7 days

📞 Call to schedule
💳 Financing available

#Botox #AntiAging #MedSpa #Houston`,
      cta: 'Book Now'
    },
    
    education: {
      title: 'Botox vs Fillers: What\'s the Difference?',
      content: `💡 Treatment Tuesday 💡

Botox and fillers work differently:

**Botox** - Relaxes muscles
→ Smooths forehead lines, crow's feet
→ Prevents new wrinkles

**Fillers** - Adds volume  
→ Plumps lips, lifts cheeks
→ Fills deep lines

Often used together for complete rejuvenation!

Questions? Comment below 👇

#Botox #Fillers #AntiAging #MedSpa`,
      cta: 'Learn More'
    },
    
    testimonial: {
      title: 'Patient Love ❤️',
      content: `"I was nervous about getting Botox for the first time, but the 
team made me feel so comfortable. My results are amazing and natural-looking!" 
- Jessica M.

⭐⭐⭐⭐⭐ 5-Star Review

Thank you Jessica! We love helping our patients look and feel their best 💕

Ready for your transformation?
📞 Book your consultation today

#HappyPatient #BotoxResults #MedSpa`,
      cta: 'Book Consultation'
    },
    
    event: {
      title: 'Open House: Free Skin Analysis',
      content: `🎉 OPEN HOUSE EVENT 🎉

📅 This Saturday, 10am-2pm
📍 ${practiceName}

FREE Services:
✅ Skin analysis ($150 value)
✅ Treatment recommendations  
✅ Exclusive event pricing
✅ Gift bags for attendees

🥂 Light refreshments served

Space limited - RSVP required!
📞 Call to reserve your spot

#OpenHouse #FreeEvent #SkinCare #Houston`,
      cta: 'RSVP Now'
    }
  };
  
  return posts[postType] || posts.education;
}

export default {
  generateMedicalLocationPage,
  generateMedicalGMBPost
};
