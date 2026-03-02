/**
 * OpenAI Content Generator - AI内容生成
 * 
 * 使用OpenAI API生成高质量、AI友好的内容
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL = 'gpt-4';

/**
 * 生成医疗Location页面
 */
export async function generateMedicalLocationPageAI(clientData, services) {
  console.log('🤖 Generating AI-powered location page...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set, using template fallback');
    return null;
  }
  
  const prompt = `
Create a comprehensive, AI-optimized location page for a medical practice.

BUSINESS INFO:
- Name: ${clientData.name}
- City: ${clientData.city}
- State: ${clientData.state}
- Services: ${services.join(', ')}
- Specialties: ${clientData.specialties?.join(', ') || 'General'}

REQUIREMENTS:
1. Write for AI citation (conversational, informative, structured)
2. Include specific details that AI models can cite
3. Add FAQ section with 5-7 common questions
4. Include statistics and credibility markers
5. Optimize for "${services[0]} near me" and similar queries
6. 800-1200 words
7. Medical compliance: include "consultation required" disclaimer

STRUCTURE:
- H1: Primary service + location
- Introduction: Problem + solution
- Services section: Detailed descriptions
- Why Choose Us: Credentials, stats, differentiators
- FAQ: Conversational Q&A format
- CTA: Clear next steps

OUTPUT FORMAT:
Return JSON with:
{
  "title": "Page title",
  "metaDescription": "Meta description",
  "h1": "Main heading",
  "content": "Full HTML content",
  "faq": [{"question": "...", "answer": "..."}],
  "schema": "JSON-LD schema"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert medical SEO copywriter specializing in GEO (Generative Engine Optimization). You create content that AI models like to cite.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    const content = response.choices[0].message.content;
    
    // 尝试解析JSON
    try {
      return JSON.parse(content);
    } catch (e) {
      // 如果不是JSON，包装一下
      return {
        title: `${clientData.name} - ${services[0]} in ${clientData.city}`,
        content: content,
        aiGenerated: true
      };
    }
    
  } catch (error) {
    console.error('OpenAI generation failed:', error.message);
    return null;
  }
}

/**
 * 生成GMB帖子
 */
export async function generateGMBPostAI(topic, clientData, options = {}) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const prompt = `
Create an engaging Google Business Profile post for a medical practice.

BUSINESS: ${clientData.name}
LOCATION: ${clientData.city}
TOPIC: ${topic}
TYPE: ${options.type || 'promotion'}

REQUIREMENTS:
1. 150-300 characters (GMB limit)
2. Include a compelling hook
3. Mention location naturally
4. Include call-to-action
5. Add 3-5 relevant hashtags
6. Medical compliance tone (professional but approachable)

OUTPUT FORMAT:
{
  "title": "Post title (if applicable)",
  "content": "Full post content with hashtags",
  "cta": "Call to action text",
  "hashtags": ["tag1", "tag2", "tag3"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });
    
    return JSON.parse(response.choices[0].message.content);
    
  } catch (error) {
    console.error('GMB post generation failed:', error.message);
    return null;
  }
}

/**
 * 生成FAQ内容
 */
export async function generateFAQContentAI(topic, count = 5) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const prompt = `
Generate ${count} FAQ entries for: ${topic}

REQUIREMENTS:
1. Questions should be conversational (how people actually ask)
2. Answers should be detailed enough for AI to cite
3. Include specific facts/stats where relevant
4. Medical accuracy (add "consultation required" where appropriate)
5. Optimize for voice search queries

OUTPUT FORMAT:
[
  {
    "question": "Question text",
    "answer": "Detailed answer (2-4 sentences)",
    "keywords": ["keyword1", "keyword2"]
  }
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    return JSON.parse(response.choices[0].message.content);
    
  } catch (error) {
    console.error('FAQ generation failed:', error.message);
    return null;
  }
}

/**
 * 优化现有内容
 */
export async function optimizeContentAI(originalContent, targetKeywords) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const prompt = `
Optimize this content for AI citation (GEO).

ORIGINAL CONTENT:
${originalContent}

TARGET KEYWORDS: ${targetKeywords.join(', ')}

OPTIMIZATION REQUIREMENTS:
1. Add FAQ section (3-5 questions)
2. Include specific statistics/facts
3. Add "pros/cons" or comparison section
4. Improve conversational tone
5. Add recency markers ("Updated 2024")
6. Include expert quotes/credentials
7. Keep all original information
8. Target length: 20% longer than original

OUTPUT: Full optimized content in markdown
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2000
    });
    
    return {
      original: originalContent,
      optimized: response.choices[0].message.content,
      improvements: [
        'Added FAQ section',
        'Enhanced with statistics',
        'Improved conversational tone',
        'Added recency markers'
      ]
    };
    
  } catch (error) {
    console.error('Content optimization failed:', error.message);
    return null;
  }
}

/**
 * 生成AI友好的Schema描述
 */
export async function generateSchemaDescriptionAI(pageContent, pageType) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const prompt = `
Generate a concise, AI-optimized description for Schema markup.

PAGE TYPE: ${pageType}
CONTENT SUMMARY: ${pageContent.substring(0, 500)}

REQUIREMENTS:
1. 150-300 characters
2. Include key services
3. Mention location
4. Include unique selling point
5. Natural language (not keyword-stuffed)

OUTPUT: Just the description text
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 200
    });
    
    return response.choices[0].message.content.trim();
    
  } catch (error) {
    return null;
  }
}

/**
 * 分析内容AI友好度
 */
export async function analyzeAIFriendlinessAI(content) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const prompt = `
Analyze this content for AI citation potential.

CONTENT:
${content.substring(0, 2000)}

ANALYZE:
1. Citation probability (0-100%)
2. Strengths for AI citation
3. Weaknesses/limitations
4. Specific improvement suggestions
5. What questions this content answers well

OUTPUT FORMAT:
{
  "citationProbability": 75,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "targetQuestions": ["..."]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    return JSON.parse(response.choices[0].message.content);
    
  } catch (error) {
    return null;
  }
}

/**
 * 批量生成GMB帖子 (一个月内容)
 */
export async function generateMonthlyGMBContentAI(clientData, topics) {
  console.log(`🤖 Generating ${topics.length} GMB posts...`);
  
  const posts = [];
  
  for (const topic of topics) {
    const post = await generateGMBPostAI(topic, clientData);
    if (post) {
      posts.push({
        ...post,
        scheduledDate: topic.date,
        topic: topic.type
      });
    }
  }
  
  return posts;
}

export default {
  generateMedicalLocationPageAI,
  generateGMBPostAI,
  generateFAQContentAI,
  optimizeContentAI,
  generateSchemaDescriptionAI,
  analyzeAIFriendlinessAI,
  generateMonthlyGMBContentAI
};
