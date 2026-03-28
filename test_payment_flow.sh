#!/bin/bash

echo "🧪 Testing Payment Flow"
echo "======================"

# Test backend health
echo -n "1. Backend Health: "
HEALTH=$(curl -s http://localhost:3000/api/health | jq -r '.data.status' 2>/dev/null)
if [ "$HEALTH" = "healthy" ]; then
  echo "✅ OK"
else
  echo "❌ FAILED - Backend not responding"
  exit 1
fi

# Test plans API
echo -n "2. Plans API: "
PLANS=$(curl -s http://localhost:3000/api/plans | jq -r '.success' 2>/dev/null)
if [ "$PLANS" = "true" ]; then
  echo "✅ OK"
  PLAN_COUNT=$(curl -s http://localhost:3000/api/plans | jq -r '.data.plans | length')
  echo "   Found $PLAN_COUNT plans"
else
  echo "❌ FAILED"
fi

# Test frontend
echo -n "3. Frontend: "
FRONTEND=$(curl -s http://localhost:5173 2>/dev/null | grep -q "<!doctype html" && echo "OK" || echo "FAILED")
if [ "$FRONTEND" = "OK" ]; then
  echo "✅ OK"
else
  echo "❌ FAILED - Frontend not responding"
fi

echo ""
echo "🎯 Test Payment Flow:"
echo "1. Open http://localhost:5173/plans"
echo "2. Open browser console (F12)"
echo "3. Login as admin"
echo "4. Click 'Select Plan' on Pro plan"
echo "5. Fill payment form and confirm"
echo "6. Check console logs for debugging info"
echo ""
echo "Console logs to watch for:"
echo "- 'Fetching plans...'"
echo "- 'Plans fetched successfully:'"
echo "- 'Starting payment confirmation for plan:'"
echo "- 'Payment confirmation completed successfully'"