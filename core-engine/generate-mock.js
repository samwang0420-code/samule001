#!/usr/bin/env node
/**
 * 生成模拟客户数据 - 用于测试
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateMockClient() {
  const clientId = `demo_${Date.now()}`;
  const outputDir = path.join(__dirname, 'outputs', clientId);
  
  await fs.mkdir(outputDir, { recursive: true });
  
  const clientData = {
    firmName: 'Glow Med Spa Houston',
    name: 'Glow Med Spa Houston',
    businessName: 'Glow Med Spa Houston',
    address: '1315 St Joseph Pkwy, Houston, TX 77002',
    city: 'Houston',
    state: 'TX',
    industry: 'medical',
    services: ['Botox', 'Fillers', 'Laser Hair Removal'],
    email: 'contact@glowmedspa.com',
    phone: '555-0123',
    geoScore: 78,
    aiCitation: 45,
    status: 'active'
  };
  
  // 保存client.json
  await fs.writeFile(
    path.join(outputDir, 'client.json'),
    JSON.stringify(clientData, null, 2)
  );
  
  // 生成schema.json
  const schema = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clientData.businessName,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1315 St Joseph Pkwy",
      addressLocality: "Houston",
      addressRegion: "TX",
      postalCode: "77002"
    },
    telephone: clientData.phone,
    services: clientData.services
  };
  await fs.writeFile(path.join(outputDir, 'schema.json'), JSON.stringify(schema, null, 2));
  
  // 生成其他必要文件
  await fs.writeFile(path.join(outputDir, 'score.json'), JSON.stringify({
    total: 78,
    breakdown: { geo: 80, schema: 75, content: 79 }
  }, null, 2));
  
  await fs.writeFile(path.join(outputDir, 'citation.json'), JSON.stringify({
    percentage: 45,
    recommendations: ['Add FAQ', 'Add statistics']
  }, null, 2));
  
  // 生成location page
  await fs.writeFile(path.join(outputDir, 'location-page.html'), `
<h1>${clientData.businessName}</h1>
<p>Address: ${clientData.address}</p>
<p>Services: ${clientData.services.join(', ')}</p>
`);
  
  // 生成gmb-posts.json
  await fs.writeFile(path.join(outputDir, 'gmb-posts.json'), JSON.stringify([
    { title: 'Welcome', content: 'Welcome to ' + clientData.businessName }
  ], null, 2));
  
  console.log('✅ Mock client generated:', clientId);
  return { clientId, clientData };
}

generateMockClient().catch(console.error);
