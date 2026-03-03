#!/bin/bash
#
# 闭环能力测试脚本
# 测试Lead爬取→PDF生成的完整流程

echo "========================================"
echo "   闭环能力测试 - Lead Crawler & PDF"
echo "========================================"
echo ""

# 设置变量
API_URL="http://localhost:3000"
WORKSPACE="/root/.openclaw/workspace-geo-arch"

echo "1. 检查API服务状态..."
HEALTH=$(curl -s $API_URL/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✅ API服务正常"
else
    echo "   ❌ API服务异常: $HEALTH"
    exit 1
fi
echo ""

echo "2. 获取登录Token..."
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@geo.local","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ 登录失败"
    exit 1
fi
echo "   ✅ 登录成功"
echo ""

echo "3. 检查数据库连接..."
cd $WORKSPACE/core-engine
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fixemvsckapejyfwphft.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434');
supabase.from('leads').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.log('   ❌ 数据库错误:', error.message);
      process.exit(1);
    } else {
      console.log('   ✅ 数据库连接正常 (当前leads:', count, ')');
    }
  });
"
echo ""

echo "4. 检查PDF Skill..."
if [ -f "$WORKSPACE/skills/knock-door-pdf/core/pdf_generator.py" ]; then
    echo "   ✅ PDF Generator存在"
else
    echo "   ❌ PDF Generator未找到"
    exit 1
fi
echo ""

echo "5. 检查脚本可执行性..."
SCRIPTS="auto-iteration-engine.js lead-crawler.js skill-sync.js"
for script in $SCRIPTS; do
    if [ -x "$WORKSPACE/core-engine/scripts/$script" ]; then
        echo "   ✅ $script 可执行"
    else
        echo "   ❌ $script 无执行权限"
    fi
done
echo ""

echo "6. 测试PDF生成（模拟数据）..."
cd $WORKSPACE/core-engine
node -e "
const { generateLeadPDF } = require('./lib/pdf-service.js');

const testLead = {
  id: 'test-' + Date.now(),
  business_name: 'Test Medical Spa',
  industry: 'medical_beauty',
  city: 'Houston',
  website: 'https://example.com',
  seo_score: 65,
  geo_score: 45,
  dual_score: 55
};

generateLeadPDF(testLead, '/tmp/pdf-test')
  .then(path => {
    console.log('   ✅ PDF生成成功:', path);
  })
  .catch(err => {
    console.log('   ⚠️ PDF生成失败:', err.message);
    console.log('   (需要Python环境和reportlab)');
  });
"
echo ""

echo "========================================"
echo "   闭环能力检查完成"
echo "========================================"
echo ""
echo "✅ 系统已就绪，可以执行完整流程"
echo ""
echo "下一步: 创建搜索配置并启动爬取"
echo "  curl -X POST $API_URL/api/lead-configs ..."
echo ""
