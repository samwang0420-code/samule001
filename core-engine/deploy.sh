#!/bin/bash
# One-Click Deployment Script - 一键部署脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}GEO Engine Deployment Script${NC}"
echo ""

INSTALL_DIR="${1:-/opt/geo-engine}"

echo "Installing to: $INSTALL_DIR"
echo ""

# 创建目录
mkdir -p "$INSTALL_DIR"

# 复制代码
echo "Copying files..."
cp -r . "$INSTALL_DIR/"

# 安装依赖
cd "$INSTALL_DIR/core-engine"
npm install --production

# 创建环境文件
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Please edit .env with your API keys"
fi

# 设置定时任务
echo "Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "0 6 * * * cd $INSTALL_DIR/core-engine && ./scheduler.sh daily") | crontab -
(crontab -l 2>/dev/null; echo "0 8 * * 1 cd $INSTALL_DIR/core-engine && ./scheduler.sh weekly") | crontab -

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Next: Edit .env and run ./production-check.sh"
