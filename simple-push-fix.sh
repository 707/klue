#!/bin/bash
# Simple fix: increase buffer and retry push

set -e
cd /Users/nad/Documents/Tests/notes

echo "==================================="
echo "Increasing HTTP buffer and retrying"
echo "==================================="
echo ""

# Increase buffer size for large push (500MB)
echo "1. Increasing HTTP post buffer to 500MB..."
git config http.postBuffer 524288000
echo "   Buffer increased"
echo ""

# Also try increasing timeout
echo "2. Increasing HTTP timeout..."
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
echo "   Timeout increased"
echo ""

# Try pushing
echo "3. Attempting push to GitHub..."
git push --force origin main
echo ""

echo "==================================="
echo "✅ Push complete!"
echo "==================================="
