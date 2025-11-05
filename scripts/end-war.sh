#!/bin/bash

# Configuration
HOST="${HOST:-localhost}"
PORT="${PORT:-5002}"
URL="http://${HOST}:${PORT}/end-war"

echo "🏁 Ending war..."
echo "📡 Calling: ${URL}"
echo ""

# Make the request
response=$(curl -s -w "\n%{http_code}" "${URL}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# Check response
if [ "$http_code" -eq 200 ]; then
  echo "✅ Success!"
  echo "Response: $body"
else
  echo "❌ Failed with HTTP status: $http_code"
  echo "Response: $body"
  exit 1
fi
