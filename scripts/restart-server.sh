#!/bin/bash

echo "🔍 Checking for existing TaskFlow processes..."
PIDS=$(pgrep -f "ts-node-dev.*backend/index.ts")

if [ ! -z "$PIDS" ]; then
  echo "Found existing processes: $PIDS"
  echo "🛑 Stopping existing TaskFlow server..."
  pkill -f "ts-node-dev.*backend/index.ts"
  sleep 2
  echo "✅ Processes stopped"
else
  echo "No existing processes found"
fi

echo "🚀 Starting TaskFlow server..."
npm run dev &
SERVER_PID=$!

echo "Server started with PID: $SERVER_PID"
echo "Waiting for server to start..."
sleep 5

echo "🔍 Testing server connection..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "FAIL")

if [ "$response" = "200" ]; then
  echo "✅ Server is responding correctly!"
  echo "🌐 You can now visit: http://localhost:3000/api/health"
else
  echo "❌ Server is not responding (HTTP: $response)"
  echo "📋 Checking server logs..."
  jobs
fi