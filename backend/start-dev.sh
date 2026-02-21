#!/bin/bash

# Kill any existing backend processes
echo "🧹 Cleaning up ALL existing backend processes..."
pkill -9 -f "ts-node.*index.ts" 2>/dev/null
pkill -9 -f "nodemon" 2>/dev/null
pkill -9 -f "start-with-cleanup" 2>/dev/null
sleep 2
echo "✓ Cleanup complete"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

echo "🚀 Starting FleetFlow Backend..."
echo "📍 Directory: $(pwd)"
echo "📊 Logs will appear below (duplicate detection enabled):"
echo "================================================"
echo ""

# Start backend with all output visible
npm run dev
