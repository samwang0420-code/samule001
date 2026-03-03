#!/bin/bash
# Deploy GEO AI Probing Service - 生产级部署脚本

set -e

echo "🚀 Deploying GEO AI Probing Service..."

# 1. 检查依赖
echo "📦 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# 2. 安装Playwright
echo "🎭 Installing Playwright..."
cd /root/.openclaw/workspace-geo-arch/core-engine
npm install playwright cheerio --save
npx playwright install chromium

# 3. 执行数据库迁移
echo "🗄️  Running database migrations..."
if command -v psql &> /dev/null; then
    psql "$SUPABASE_URL" -f ../supabase/add-agentic-probing-schema.sql
    echo "✅ Database tables created"
else
    echo "⚠️  psql not found. Please manually run:"
    echo "   psql \$SUPABASE_URL -f supabase/add-agentic-probing-schema.sql"
fi

# 4. 部署systemd服务
echo "🔧 Deploying systemd service..."
cp scripts/geo-probing.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable geo-probing.service
echo "✅ Service installed"

# 5. 部署cron任务
echo "⏰ Deploying cron job..."
cp scripts/geo-probing.cron /etc/cron.d/geo-probing
chmod 644 /etc/cron.d/geo-probing
echo "✅ Cron job installed"

# 6. 创建日志文件
touch /var/log/geo-probing.log
chmod 644 /var/log/geo-probing.log

# 7. 测试运行
echo "🧪 Testing service..."
node lib/ai-probing-service.js 2>&1 | head -20

echo ""
echo "✅ Deployment completed!"
echo ""
echo "Usage:"
echo "  systemctl start geo-probing     # 立即运行一次"
echo "  systemctl status geo-probing    # 查看状态"
echo "  journalctl -u geo-probing -f    # 查看日志"
echo "  tail -f /var/log/geo-probing.log # 查看cron日志"
echo ""
echo "Manual test:"
echo "  node lib/ai-probing-service.js [client_id]"
