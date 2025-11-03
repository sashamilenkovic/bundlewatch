#!/bin/bash
set -e

echo "🗑️  Unpublishing broken versions..."

npm unpublish @milencode/bundlewatch-core@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: core"
npm unpublish @milencode/bundlewatch-cli@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: cli"
npm unpublish @milencode/bundlewatch-dashboard@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: dashboard"
npm unpublish @milencode/bundlewatch-lighthouse-plugin@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: lighthouse-plugin"
npm unpublish @milencode/bundlewatch-next-plugin@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: next-plugin"
npm unpublish @milencode/bundlewatch-vite-plugin@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: vite-plugin"
npm unpublish @milencode/bundlewatch-webpack-plugin@1.1.3 --force || echo "⚠️  Already unpublished or doesn't exist: webpack-plugin"

echo ""
echo "✅ Unpublish complete!"
echo ""
echo "🔨 Building all packages..."

pnpm -r build

echo ""
echo "📦 Publishing all packages with pnpm (this replaces workspace:* correctly)..."

pnpm -r publish --access public --no-git-checks

echo ""
echo "🎉 All done! Packages published correctly."

