/**
 * AI Content Generator
 * 
 * Generates optimized content for immigration law firms
 * Including location pages, FAQs, and GMB posts
 */

import * as knowledgeGraph from './knowledge-graph.js';
import * as citationEngine from './citation-engine.js';

/**
 * Generate location page content
 */
export function generateLocationPage(lawFirmData, practiceAreas = []) {
  const location = lawFirmData.city || 'Houston';
  const firmName = lawFirmData.name;
  
  // Get relevant entities
  const entities = practiceAreas.flatMap(area => 
    knowledgeGraph.getRelatedEntities(area)
  );
  
  const content = {
    title: `${firmName} | Immigration Lawyers in ${location}`,
    metaDescription: `Experienced immigration attorneys in ${location} specializing in ${practiceAreas.slice(0, 3).join(', ')}. Free consultation available.`,
    
    hero: generateHeroSection(firmName, location, practiceAreas),
    
    introduction: generateIntroduction(firmName, location, practiceAreas),
    
    services: generateServicesSection(practiceAreas),
    
    localContext: generateLocalContextSection(location),
    
    faq: generateFAQSection(practiceAreas),
    
    whyChooseUs: generateWhyChooseUsSection(),
    
    cta: generateCTASection(firmName, lawFirmData.phone),
    
    schema: knowledgeGraph.generateEnhancedSchema(lawFirmData, practiceAreas)
  };
  
  // Check citation probability
  const fullContent = Object.values(content).filter(v => typeof v === 'string').join(' ');
  content.citationScore = citationEngine.calculateCitationProbability(fullContent);
  
  return content;
}

function generateHeroSection(firmName, location, practiceAreas) {
  const mainService = practiceAreas[0] || 'Immigration Law';
  return `
${firmName}: Trusted Immigration Attorneys in ${location}

Navigating the complex US immigration system requires experienced legal guidance. 
At ${firmName}, we provide comprehensive ${mainService.toLowerCase()} services to individuals, 
families, and businesses throughout ${location} and surrounding areas.

📞 Call now for a free consultation
  `.trim();
}

function generateIntroduction(firmName, location, practiceAreas) {
  const visaList = practiceAreas.slice(0, 5).join(', ');
  
  return `
## Expert Immigration Legal Services in ${location}

${firmName} is a leading immigration law firm serving clients in ${location}, 
Texas. Our experienced attorneys specialize in ${visaList}, helping 
clients achieve their American dream.

### Our Immigration Practice Areas

${practiceAreas.map(area => `- ${area}`).join('\n')}

Whether you're seeking an H-1B visa for specialized employment, pursuing a 
green card through family sponsorship, or need defense in removal proceedings, 
our ${location} immigration lawyers have the knowledge and experience to guide 
you through every step of the process.
  `.trim();
}

function generateServicesSection(practiceAreas) {
  const serviceDetails = {
    'H-1B Visa': {
      description: 'Specialty occupation visas for skilled workers',
      process: 'We handle LCA preparation, petition filing, and RFE responses',
      timeline: '6-8 months (regular), 15 days (premium)'
    },
    'Green Card': {
      description: 'Permanent residence through employment or family',
      process: 'From I-130/I-140 filing to adjustment of status or consular processing',
      timeline: '12 months to several years depending on category'
    },
    'Family Immigration': {
      description: 'Reuniting families through immigrant visas',
      process: 'Sponsorship petitions, visa applications, and adjustment of status',
      timeline: 'Varies by relationship and country of origin'
    },
    'Asylum': {
      description: 'Protection for those facing persecution',
      process: 'Asylum application preparation, evidence gathering, and interview representation',
      timeline: '6 months to several years'
    },
    'Deportation Defense': {
      description: 'Representation in removal proceedings',
      process: 'Bond hearings, relief applications, and immigration court representation',
      timeline: 'Varies by case complexity'
    },
    'Citizenship': {
      description: 'Naturalization and citizenship applications',
      process: 'N-400 filing, interview preparation, and oath ceremony',
      timeline: '8-12 months'
    }
  };
  
  return `
## Our Immigration Services

${practiceAreas.map(area => {
  const details = serviceDetails[area] || { description: area, process: 'Contact us for details', timeline: 'Varies' };
  return `### ${area}

${details.description}.

**Our Process:** ${details.process}

**Timeline:** ${details.timeline}

**Key Forms:** ${getFormsForService(area)}`;
}).join('\n\n')}
  `.trim();
}

function getFormsForService(service) {
  const forms = {
    'H-1B Visa': 'Form I-129, LCA',
    'Green Card': 'Form I-130, I-140, I-485 or DS-260',
    'Family Immigration': 'Form I-130, I-485 or DS-260',
    'Asylum': 'Form I-589',
    'Deportation Defense': 'Various EOIR forms',
    'Citizenship': 'Form N-400'
  };
  return forms[service] || 'Contact for specific forms';
}

function generateLocalContextSection(location) {
  const contexts = {
    'Houston': {
      landmarks: ['Texas Medical Center', 'Energy Corridor', 'NASA Johnson Space Center'],
      industries: ['Energy/Oil & Gas', 'Healthcare', 'Technology', 'Aerospace'],
      court: 'USCIS Houston Field Office at Greenspoint'
    }
  };
  
  const ctx = contexts[location] || contexts['Houston'];
  
  return `
## ${location} Immigration Resources

### Local Immigration Court and Offices

- ${ctx.court}
- Houston Immigration Court (downtown)
- Houston Asylum Office

### Major Industries We Serve

Our ${location} immigration attorneys serve professionals in:

${ctx.industries.map(i => `- ${i}`).join('\n')}

### Convenient Location

Located near ${ctx.landmarks.slice(0, 2).join(' and ')}, our office is easily 
accessible from throughout the greater ${location} area. We offer both in-person 
and virtual consultations to serve clients across Texas.
  `.trim();
}

function generateFAQSection(practiceAreas) {
  const faqs = [
    {
      q: `How long does the ${practiceAreas[0] || 'immigration'} process take in ${location}?`,
      a: `Processing times vary based on case type and current USCIS workload. ${practiceAreas[0] || 'Most cases'} typically take 6-12 months, but we can provide a more specific timeline during your consultation.`
    },
    {
      q: 'What documents do I need for my immigration case?',
      a: 'Required documents vary by case type but generally include: passport, birth certificate, marriage certificate (if applicable), financial documents, and evidence of your eligibility. We provide a complete checklist during your initial consultation.'
    },
    {
      q: `Can I work while my ${practiceAreas[0] || 'immigration'} application is pending?`,
      a: 'Work authorization depends on your specific case type and current status. Many applicants can file for an Employment Authorization Document (EAD) while their case is pending. We\'ll advise you on your specific situation.'
    },
    {
      q: 'Do you offer payment plans?',
      a: 'Yes, we understand immigration cases can be expensive. We offer flexible payment plans to make quality legal representation accessible. Contact us to discuss options.'
    },
    {
      q: `What makes your ${location} immigration lawyers different?`,
      a: 'Our attorneys have 15+ years of combined experience, speak multiple languages, and have successfully handled thousands of immigration cases. We provide personalized attention and keep you informed throughout the process.'
    }
  ];
  
  return `
## Frequently Asked Questions

${faqs.map(faq => `**Q: ${faq.q}**

A: ${faq.a}`).join('\n\n')}
  `.trim();
}

function generateWhyChooseUsSection() {
  return `
## Why Choose ${firmName}

### Experienced Immigration Attorneys

Our lawyers have helped thousands of clients navigate the complex US immigration system. 
We stay current with changing immigration laws and policies to provide the best possible 
representation.

### Personalized Attention

Every immigration case is unique. We take the time to understand your specific situation 
and develop a customized strategy to achieve your goals.

### Transparent Communication

We believe in clear, honest communication. You'll always know where your case stands 
and what to expect next. We respond to calls and emails promptly.

### Proven Results

Our firm has a 95% success rate on immigration applications. We've helped clients from 
over 50 countries achieve their immigration dreams.

### Multilingual Services

Our staff speaks English, Spanish, Mandarin, and Hindi to better serve our diverse 
clientele.
  `.trim();
}

function generateCTASection(firmName, phone) {
  return `
## Schedule Your Free Immigration Consultation

Don't navigate the immigration system alone. Contact ${firmName} today for a 
free consultation with an experienced immigration attorney.

📞 **Call ${phone || '(713) 555-0123'}**

🕐 **Office Hours:** Monday - Friday, 9:00 AM - 6:00 PM

📍 **Location:** Conveniently located in Houston, TX

**We offer:**
- Free initial consultations
- Virtual appointments available
- Flexible payment plans
- Evening and weekend appointments upon request

*Disclaimer: This website is for informational purposes only and does not constitute 
legal advice. Every immigration case is unique. Contact us for advice specific to 
your situation.*
  `.trim();
}

/**
 * Generate GMB post
 */
export function generateGMBPost(postType, data = {}) {
  const posts = {
    news: {
      title: 'Immigration Law Update',
      content: `📢 Immigration Update: ${data.update || 'USCIS announces new filing fee schedule effective April 2024. Contact us to understand how this may affect your case.'}

Questions? Call ${data.phone || 'our office'} for a free consultation.

#ImmigrationLaw #USCIS #${data.hashtag || 'HoustonImmigration'}`,
      cta: 'Learn More'
    },
    
    tip: {
      title: 'Immigration Tip',
      content: `💡 Immigration Tip: ${data.tip || 'Always keep copies of all documents submitted to USCIS. Create a dedicated file for your immigration case and organize documents by date.'}

Need help with your case? We're here to help.

#ImmigrationTips #ImmigrationLawyer`,
      cta: 'Contact Us'
    },
    
    event: {
      title: 'Free Immigration Workshop',
      content: `📅 Join us for a free immigration workshop!

📍 Location: ${data.location || 'Our office'}
📅 Date: ${data.date || 'Contact us for next session'}
⏰ Time: ${data.time || '6:00 PM - 7:30 PM'}

Topics: ${data.topics || 'H-1B visas, Green Cards, Citizenship'}

Space is limited. RSVP required.

#ImmigrationWorkshop #FreeEvent #Houston`,
      cta: 'RSVP Now'
    },
    
    testimonial: {
      title: 'Client Success Story',
      content: `"${data.quote || 'The team at this law firm made our green card process smooth and stress-free. Highly recommend!'}" - ${data.client || 'Satisfied Client'}

We love helping families achieve their immigration goals! 💚

Call us to start your success story.

#ClientTestimonial #GreenCard #ImmigrationSuccess`,
      cta: 'Read More Reviews'
    },
    
    offer: {
      title: 'Free Consultation',
      content: `🎉 Special Offer: FREE Immigration Consultation

✅ Evaluate your case
✅ Discuss your options  
✅ Get a roadmap to success

Limited time offer. Schedule today!

📞 ${data.phone || 'Call now'}

#FreeConsultation #ImmigrationLawyer #Houston`,
      cta: 'Book Now'
    }
  };
  
  return posts[postType] || posts.tip;
}

/**
 * Generate FAQ Schema markup
 */
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate complete content package
 */
export function generateContentPackage(lawFirmData, practiceAreas) {
  const locationPage = generateLocationPage(lawFirmData, practiceAreas);
  
  return {
    locationPage,
    gmbPosts: {
      news: generateGMBPost('news'),
      tip: generateGMBPost('tip'),
      event: generateGMBPost('event'),
      testimonial: generateGMBPost('testimonial'),
      offer: generateGMBPost('offer')
    },
    faqSchema: generateFAQSchema([
      { question: 'How long does the process take?', answer: 'Processing times vary by case type...' },
      { question: 'What documents do I need?', answer: 'Required documents include...' }
    ]),
    citationScore: locationPage.citationScore,
    recommendations: locationPage.citationScore.recommendations
  };
}

export default {
  generateLocationPage,
  generateGMBPost,
  generateFAQSchema,
  generateContentPackage
};
