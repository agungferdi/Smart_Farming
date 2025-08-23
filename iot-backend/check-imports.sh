#!/bin/bash

echo "🔍 Checking TypeScript compilation..."

# Check if TypeScript compiles without errors
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation successful!"
  echo "✅ All imports are working correctly without .js extensions!"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi
