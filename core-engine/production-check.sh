#!/bin/bash
# Production Checklist - 生产就绪检查清单
# 
# 运行所有检查，确保系统达到生产标准

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     PRODUCTION READINESS CHECKLIST                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

echo "📋 SECTION 1: ENVIRONMENT CHECKS"
echo "─────────────────────────────────"

# Check Node.js version
if command -v node > /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        check_pass "Node.js version $(node -v)"
    else
        check_fail "Node.js version too old (need 18+, have $(node -v))"
    fi
else
    check_fail "Node.js not found"
fi

# Check npm
if command -v npm > /dev/null; then
    check_pass "npm installed"
else
    check_fail "npm not found"
fi

# Check .env file
if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check required variables
    if grep -q "APIFY_TOKEN" .env && grep -q "SUPABASE_URL" .env; then
        check_pass "Required environment variables set"
    else
        check_fail "Missing required environment variables"
    fi
else
    check_fail ".env file not found (copy from .env.example)"
fi

echo ""
echo "📋 SECTION 2: FILE STRUCTURE CHECKS"
echo "────────────────────────────────────"

# Check critical files
CRITICAL_FILES=(
    "package.json"
    "geo.js"
    "run.js"
    "medical-pipeline.js"
    "lib/db.js"
    "lib/apify.js"
    "lib/error-handler.js"
    "lib/logger.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "File exists: $file"
    else
        check_fail "Missing file: $file"
    fi
done

# Check directories
CRITICAL_DIRS=(
    "lib"
    "outputs"
    "logs"
)

for dir in "${CRITICAL_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_pass "Directory exists: $dir"
    else
        check_warn "Missing directory: $dir (will be created)"
        mkdir -p "$dir"
    fi
done

echo ""
echo "📋 SECTION 3: DEPENDENCY CHECKS"
echo "────────────────────────────────"

# Check node_modules
if [ -d "node_modules" ]; then
    check_pass "node_modules installed"
    
    # Check critical dependencies
    if [ -d "node_modules/@supabase" ] && [ -d "node_modules/node-fetch" ]; then
        check_pass "Critical dependencies installed"
    else
        check_fail "Missing dependencies (run: npm install)"
    fi
else
    check_fail "node_modules not found (run: npm install)"
fi

echo ""
echo "📋 SECTION 4: SYNTAX VALIDATION"
echo "────────────────────────────────"

# Syntax check all JS files
SYNTAX_ERRORS=0
for file in *.js lib/*.js; do
    if [ -f "$file" ]; then
        if node --check "$file" 2>/dev/null; then
            :
        else
            check_fail "Syntax error in: $file"
            ((SYNTAX_ERRORS++))
        fi
    fi
done

if [ $SYNTAX_ERRORS -eq 0 ]; then
    check_pass "All JavaScript files have valid syntax"
fi

echo ""
echo "📋 SECTION 5: FUNCTIONAL TESTS"
echo "───────────────────────────────"

# Test basic imports
echo "Testing module imports..."
if node -e "import('./lib/db.js').then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    check_pass "Database module loads"
else
    check_fail "Database module failed to load"
fi

if node -e "import('./lib/logger.js').then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    check_pass "Logger module loads"
else
    check_fail "Logger module failed to load"
fi

if node -e "import('./lib/error-handler.js').then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    check_pass "Error handler module loads"
else
    check_fail "Error handler module failed to load"
fi

echo ""
echo "📋 SECTION 6: API CONNECTION TESTS"
echo "───────────────────────────────────"

# Source environment variables
set -a
source .env 2>/dev/null || true
set +a

# Test Apify (if token available)
if [ -n "$APIFY_TOKEN" ]; then
    echo "Testing Apify connection..."
    if curl -s -o /dev/null -w "%{http_code}" "https://api.apify.com/v2/users/me" -H "Authorization: Bearer $APIFY_TOKEN" | grep -q "200"; then
        check_pass "Apify API accessible"
    else
        check_warn "Apify API connection failed (will use demo mode)"
    fi
else
    check_warn "APIFY_TOKEN not set (will use demo mode)"
fi

# Test Supabase (if credentials available)
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
    echo "Testing Supabase connection..."
    # Note: Real test would require a query, skipping for now
    check_warn "Supabase connection not tested (run test-db.js for full test)"
else
    check_warn "Supabase credentials not set (will use local storage)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "───────────────────────────────────────────────────────────"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 System appears ready for production!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review any warnings above"
    echo "  2. Run: ./test-run.sh for full integration test"
    echo "  3. Deploy to production server"
    exit 0
else
    echo -e "${RED}⚠️  Please fix FAILED items before production deployment${NC}"
    exit 1
fi
