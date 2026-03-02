/**
 * Report Generator - 客户报告生成器
 * 
 * 生成专业的客户周报/月报
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 生成客户周报
 */
export async function generateWeeklyReport(clientId, weekData) {
  const report = `
# GEO Performance Report
## Week of ${weekData.weekStart} - ${weekData.weekEnd}

Dear ${weekData.clientName},

Here's your weekly GEO performance report. Your AI visibility continues to improve!

---

## 📊 Executive Summary

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| **AI Citation Rate** | ${weekData.aiCitationRate}% | ${weekData.lastWeekAiCitationRate}% | ${weekData.aiCitationRate - weekData.lastWeekAiCitationRate >= 0 ? '+' : ''}${weekData.aiCitationRate - weekData.lastWeekAiCitationRate}% |
| **Google Avg Rank** | #${weekData.avgRank} | #${weekData.lastWeekAvgRank} | ${weekData.lastWeekAvgRank - weekData.avgRank >= 0 ? '+' : ''}${weekData.lastWeekAvgRank - weekData.avgRank} |
| **Keywords on Page 1** | ${weekData.page1Keywords} | ${weekData.lastWeekPage1Keywords} | ${weekData.page1Keywords - weekData.lastWeekPage1Keywords >= 0 ? '+' : ''}${weekData.page1Keywords - weekData.lastWeekPage1Keywords} |
| **GMB Views** | ${weekData.gmbViews} | ${weekData.lastWeekGmbViews} | ${weekData.gmbViews - weekData.lastWeekGmbViews >= 0 ? '+' : ''}${weekData.gmbViews - weekData.lastWeekGmbViews} |

**Status:** ${weekData.aiCitationRate >= 50 ? '🟢 On Track' : weekData.aiCitationRate >= 30 ? '🟡 Improving' : '🔴 Needs Attention'}

---

## 🤖 AI Visibility (Perplexity, ChatGPT)

### Citation Performance

| Query | Cited? | Rank | Trend |
|-------|--------|------|-------|
${weekData.aiQueries?.map(q => `| "${q.query}" | ${q.cited ? '✅ Yes' : '❌ No'} | ${q.rank || '-'} | ${q.trend || '→'} |`).join('\n') || '| No data yet | - | - | -'}

### Key Insights
${weekData.aiInsights?.map(i => `- ${i}`).join('\n') || '- Building AI visibility baseline\n- Optimizing content for conversational queries'}

---

## 📈 Google Rankings

### Top Performing Keywords

| Keyword | Current | Last Week | Change |
|---------|---------|-----------|--------|
${weekData.keywords?.map(k => `| "${k.term}" | #${k.current} | #${k.lastWeek} | ${k.change > 0 ? '+' : ''}${k.change} |`).join('\n') || '| Data collecting | - | - |'}

### Ranking Trend

\`\`\`
${generateRankingChart(weekData.keywords)}
\`\`\`

---

## 🎯 Competitor Analysis

### Your Position vs Competitors

| Competitor | Avg Rank | AI Citations | GMB Rating |
|------------|----------|--------------|------------|
| **Your Clinic** | #${weekData.avgRank} | ${weekData.aiCitationRate}% | ${weekData.gmbRating} |
${weekData.competitors?.map(c => `| ${c.name} | #${c.avgRank} | ${c.aiCitationRate}% | ${c.gmbRating} |`).join('\n') || '| Competitor A | #- | -% | 4.5 |\n| Competitor B | #- | -% | 4.3 |'}

**Competitor Moves:**
${weekData.competitorMoves?.map(m => `- ${m}`).join('\n') || '- No significant changes detected'}

---

## ✅ Actions Completed This Week

${weekData.actionsCompleted?.map(a => `- ✅ ${a}`).join('\n') || '- Daily ranking monitoring\n- Competitor tracking\n- AI citation analysis'}

---

## 🎯 Planned for Next Week

${weekData.plannedActions?.map(a => `- [ ] ${a}`).join('\n') || '- [ ] Add FAQ Schema to service pages\n- [ ] Create comparison content\n- [ ] Optimize for 2 new keywords'}

---

## 💡 Recommendations

${weekData.recommendations?.map(r => `### ${r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢'} ${r.title}\n${r.description}\n**Expected Impact:** ${r.impact}\n`).join('\n') || `### 🟡 Add FAQ Content
AI models favor FAQ-style content. Adding 5-10 Q&A pairs to your top service pages can increase citation probability by 15-25%.

**Expected Impact:** +15-25% AI citation rate

### 🟡 Refresh Content
Your main pages haven't been updated in 30 days. Adding "Updated 2024" markers and new statistics improves AI trust signals.

**Expected Impact:** +10% citation probability`}

---

## 📞 Questions?

Reply to this email or schedule a call: [Calendly Link]

**Your GEO Team**  
StackMatrices

---

*This report was generated automatically by the StackMatrices GEO Platform.*
`.trim();

  return report;
}

function generateRankingChart(keywords) {
  if (!keywords || keywords.length === 0) {
    return 'No ranking data available yet';
  }
  
  return keywords.slice(0, 5).map(k => {
    const bar = '█'.repeat(Math.max(1, 10 - Math.floor(k.current / 2))) + 
                '░'.repeat(Math.min(10, Math.floor(k.current / 2)));
    return `${k.term.padEnd(20)} ${bar} #${k.current}`;
  }).join('\n');
}

/**
 * 生成月度ROI报告
 */
export async function generateMonthlyROIReport(clientId, monthData) {
  return `
# Monthly ROI Report
## ${monthData.month} ${monthData.year}

## Investment Summary

| Item | Amount |
|------|--------|
| GEO Service Fee | $${monthData.serviceFee} |
| Ad Spend (if applicable) | $${monthData.adSpend || 0} |
| **Total Investment** | **$${monthData.serviceFee + (monthData.adSpend || 0)}** |

## Results

| Metric | Before GEO | After GEO | Improvement |
|--------|------------|-----------|-------------|
| AI Citation Rate | ${monthData.before.aiCitation}% | ${monthData.after.aiCitation}% | +${monthData.after.aiCitation - monthData.before.aiCitation}% |
| Google Avg Rank | #${monthData.before.avgRank} | #${monthData.after.avgRank} | +${monthData.before.avgRank - monthData.after.avgRank} positions |
| Website Traffic | ${monthData.before.traffic} | ${monthData.after.traffic} | +${Math.round(((monthData.after.traffic - monthData.before.traffic) / monthData.before.traffic) * 100)}% |
| New Consultations | ${monthData.before.consultations} | ${monthData.after.consultations} | +${monthData.after.consultations - monthData.before.consultations} |

## ROI Calculation

**New Customers:** ${monthData.newCustomers}  
**Average Customer Value:** $${monthData.avgCustomerValue}  
**Revenue Generated:** $${monthData.newCustomers * monthData.avgCustomerValue}

**ROI:** ${Math.round(((monthData.newCustomers * monthData.avgCustomerValue) - monthData.serviceFee) / monthData.serviceFee * 100)}%

---

**Your GEO investment is paying off!**
`.trim();
}

/**
 * 保存报告
 */
export async function saveReport(clientId, report, type = 'weekly') {
  const outputDir = path.join(__dirname, '../outputs', clientId, 'reports');
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `${type}-${new Date().toISOString().split('T')[0]}.md`;
  const filepath = path.join(outputDir, filename);
  
  await fs.writeFile(filepath, report);
  return filepath;
}

export default {
  generateWeeklyReport,
  generateMonthlyROIReport,
  saveReport
};
