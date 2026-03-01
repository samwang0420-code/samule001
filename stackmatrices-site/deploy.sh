#!/bin/bash
# Deploy script for StackMatrices GEO subfolder

set -e

echo "🚀 Building GEO site..."

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the site
echo "🔨 Building..."
npm run build

# Check build output
if [ ! -d "dist/geo" ]; then
    echo "❌ Build failed: dist/geo not found"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📁 Build output: dist/geo/"
echo ""
echo "Next steps:"
echo "1. Upload dist/geo/ contents to your server at stackmatrices.com/geo/"
echo "2. Or deploy to Vercel: npx vercel --prod"
echo ""
echo "📋 Files to deploy:"
ls -la dist/geo/
