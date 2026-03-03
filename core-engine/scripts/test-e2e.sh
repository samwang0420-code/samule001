#!/bin/bash
# End-to-End Test Script
# 端到端测试 - 验证完整数据流

echo "╔════════════════════════════════════════════════════════╗"
echo "║        End-to-End Test - 端到端数据流验证              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"
TOKEN="test-token"  # Will get 401 but that's expected

# Test 1: Server Health
echo "🧪 Test 1: Server Health Check"
RESPONSE=$(curl -s ${BASE_URL}/api/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo "✅ Server is healthy"
else
    echo "❌ Server health check failed"
    exit 1
fi
echo ""

# Test 2: API Endpoints (Protected)
echo "🧪 Test 2: API Endpoint Verification"
ENDPOINTS=(
    "/api/clients"
    "/api/probing/all/summary"
    "/api/probing/all/latest"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}${endpoint})
    if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
        echo "✅ ${endpoint} - Protected (status: ${STATUS})"
    elif [ "$STATUS" = "200" ]; then
        echo "✅ ${endpoint} - Working (status: ${STATUS})"
    else
        echo "⚠️  ${endpoint} - Status: ${STATUS}"
    fi
done
echo ""

# Test 3: Dashboard Pages
echo "🧪 Test 3: Dashboard Pages"
PAGES=("/" "/login.html" "/analysis-request.html")
for page in "${PAGES[@]}"; do
    SIZE=$(curl -s ${BASE_URL}${page} | wc -c)
    if [ "$SIZE" -gt 1000 ]; then
        echo "✅ ${page} - Loaded (${SIZE} bytes)"
    else
        echo "❌ ${page} - Failed (${SIZE} bytes)"
    fi
done
echo ""

# Test 4: HTML Structure
echo "🧪 Test 4: Rankings + AI Citations Menu"
HTML=$(curl -s ${BASE_URL}/)

if echo "$HTML" | grep -q "showPage('rankings')"; then
    echo "✅ Rankings menu exists"
else
    echo "❌ Rankings menu missing"
fi

if echo "$HTML" | grep -q "showPage('ai-citations')"; then
    echo "✅ AI Citations menu exists"
else
    echo "❌ AI Citations menu missing"
fi

if echo "$HTML" | grep -q "function loadRankings"; then
    echo "✅ loadRankings() function exists"
else
    echo "❌ loadRankings() function missing"
fi

if echo "$HTML" | grep -q "function loadAICitations"; then
    echo "✅ loadAICitations() function exists"
else
    echo "❌ loadAICitations() function missing"
fi
echo ""

# Test 5: JavaScript Module Syntax
echo "🧪 Test 5: JavaScript Module Syntax"
cd /root/.openclaw/workspace-geo-arch/core-engine

MODULES=(
    "lib/ai-probing-service.js"
    "lib/api-server.js"
    "lib/semantic-fingerprint.js"
)

for module in "${MODULES[@]}"; do
    if node --check "$module" 2>/dev/null; then
        echo "✅ ${module} - Syntax OK"
    else
        echo "❌ ${module} - Syntax Error"
    fi
done
echo ""

# Test 6: Playwright Installation
echo "🧪 Test 6: Playwright Installation"
if [ -d "$HOME/.cache/ms-playwright/chromium-"* ]; then
    echo "✅ Playwright Chromium installed"
else
    echo "⚠️  Playwright Chromium not found (run: npx playwright install chromium)"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║                     Test Complete                      ║"
echo "╚════════════════════════════════════════════════════════╝"
