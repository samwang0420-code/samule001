#!/usr/bin/env node
/**
 * Pricing Calculator - 定价计算器
 * 
 * 根据客户情况生成报价
 */

const PRICING = {
  setup: {
    base: 2000,
    includes: [
      'Complete GEO Analysis',
      'AI Citation Audit',
      'Competitor Analysis',
      'Schema Deployment Package',
      'GMB Optimization Guide',
      'Content Templates',
      '90 Days Monitoring Setup'
    ]
  },
  
  monthly: {
    growth: {
      price: 500,
      includes: [
        'Daily Ranking Monitoring',
        'Weekly Performance Reports',
        'Monthly Strategy Calls',
        'AI Citation Tracking',
        'Competitor Alerts',
        'Email Support'
      ]
    },
    scale: {
      price: 1000,
      includes: [
        'Everything in Growth',
        'Content Creation (4 posts/month)',
        'GMB Management',
        'Review Response Management',
        'Priority Support',
        'Custom Reporting'
      ]
    },
    enterprise: {
      price: 2500,
      includes: [
        'Everything in Scale',
        'Unlimited Locations',
        'Dedicated Account Manager',
        'Custom Integrations',
        'White-label Reports',
        'SLA Guarantee'
      ]
    }
  }
};

function calculatePricing(options) {
  const {
    locations = 1,
    services = [],
    currentTraffic = 0,
    competitionLevel = 'medium', // low, medium, high
    packageType = 'growth'
  } = options;
  
  let setupPrice = PRICING.setup.base;
  let monthlyPrice = PRICING.monthly[packageType]?.price || PRICING.monthly.growth.price;
  
  // 多地点加价
  if (locations > 1) {
    setupPrice += (locations - 1) * 500;
    monthlyPrice += (locations - 1) * 200;
  }
  
  // 高竞争市场加价
  if (competitionLevel === 'high') {
    setupPrice *= 1.3;
    monthlyPrice *= 1.2;
  }
  
  // 计算预期ROI
  const avgCustomerValue = 3000; // 医疗客户平均价值
  const conversionRate = 0.05; // 5%咨询转化率
  const expectedNewCustomers = Math.ceil(currentTraffic * 0.3 * conversionRate); // 30%流量增长
  const monthlyRevenue = expectedNewCustomers * avgCustomerValue;
  const roi = ((monthlyRevenue - monthlyPrice) / monthlyPrice * 100).toFixed(0);
  
  return {
    setup: Math.round(setupPrice),
    monthly: Math.round(monthlyPrice),
    yearly: Math.round(monthlyPrice * 12 * 0.9), // 年付9折
    expectedNewCustomers,
    monthlyRevenue,
    roi: roi > 0 ? roi : 0,
    breakEvenMonths: Math.ceil(setupPrice / (monthlyRevenue - monthlyPrice))
  };
}

function generateProposal(options) {
  const pricing = calculatePricing(options);
  
  return `
# GEO Service Proposal

## Client: ${options.clientName || '[Client Name]'}
## Date: ${new Date().toLocaleDateString()}

---

## 💰 Investment

### Setup Fee: $${pricing.setup.toLocaleString()}

**Includes:**
${PRICING.setup.includes.map(i => `- ${i}`).join('\n')}

### Monthly Service: $${pricing.monthly.toLocaleString()}/month

**${options.packageType?.toUpperCase() || 'GROWTH'} Package Includes:**
${PRICING.monthly[options.packageType || 'growth'].includes.map(i => `- ${i}`).join('\n')}

**Yearly (10% off):** $${pricing.yearly.toLocaleString()}/year

---

## 📈 Expected ROI

| Metric | Value |
|--------|-------|
| Expected New Customers/Month | ${pricing.expectedNewCustomers} |
| Average Customer Value | $3,000 |
| Monthly Revenue Increase | $${pricing.monthlyRevenue.toLocaleString()} |
| Service Investment | $${pricing.monthly.toLocaleString()} |
| **Net Monthly Gain** | **$${(pricing.monthlyRevenue - pricing.monthly).toLocaleString()}** |
| **ROI** | **${pricing.roi}%** |
| **Break-even** | **${pricing.breakEvenMonths} months** |

---

## 🎯 Projected Results

### 30 Days
- ✅ Complete GEO audit
- ✅ Schema deployed
- ✅ GMB optimized
- ✅ Monitoring active

### 60 Days
- ✅ Google rankings improve
- ✅ AI citations start appearing
- ✅ Website traffic +30%
- ✅ Consultations increase

### 90 Days
- ✅ 3-5 keywords on page 1
- ✅ AI citation rate +35%
- ✅ Positive ROI achieved
- ✅ Sustained growth

---

## 📝 Terms

- **Contract Length:** 6-month minimum
- **Payment:** Setup due on signing, monthly on 1st
- **Cancellation:** 30-day notice
- **Guarantee:** If no improvement in 90 days, free month

---

**Ready to dominate AI search?**

Contact us to get started.

---

StackMatrices GEO Platform  
geo@stackmatrices.com
`.trim();
}

// CLI
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
GEO Pricing Calculator

Usage:
  node pricing.js [options]

Options:
  --name "Client Name"
  --locations N          Number of locations (default: 1)
  --package TYPE         Package: growth, scale, enterprise (default: growth)
  --competition LEVEL    Competition: low, medium, high (default: medium)
  --traffic N           Current monthly traffic (default: 0)
  --proposal            Generate full proposal

Examples:
  node pricing.js --name "Glow Med Spa" --locations 1 --package growth --competition high
  node pricing.js --name "Dental Group" --locations 3 --package scale --proposal
`);
    return;
  }
  
  // 解析参数
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'locations' || key === 'traffic') {
      options[key] = parseInt(value) || 0;
    } else {
      options[key] = value;
    }
  }
  
  const pricing = calculatePricing(options);
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     GEO Pricing Estimate                                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Setup Fee:        $${pricing.setup.toLocaleString()}`);
  console.log(`Monthly:          $${pricing.monthly.toLocaleString()}`);
  console.log(`Yearly (10% off): $${pricing.yearly.toLocaleString()}\n`);
  
  console.log('Expected ROI:');
  console.log(`  New Customers/Month: ${pricing.expectedNewCustomers}`);
  console.log(`  Monthly Revenue:     $${pricing.monthlyRevenue.toLocaleString()}`);
  console.log(`  ROI:                 ${pricing.roi}%`);
  console.log(`  Break-even:          ${pricing.breakEvenMonths} months\n`);
  
  if (options.proposal) {
    const proposal = generateProposal(options);
    console.log('\n--- FULL PROPOSAL ---\n');
    console.log(proposal);
  }
}

main();

export { calculatePricing, generateProposal };
