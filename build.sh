#!/bin/bash

echo "=== Build Script Starting ==="
echo "RAILWAY_PUBLIC_DOMAIN: $RAILWAY_PUBLIC_DOMAIN"
echo "NODE_ENV: $NODE_ENV"

# Clean previous builds
rm -rf frontend/dist frontend/node_modules

# Install frontend dependencies
cd frontend
npm install

# Set the API URL based on Railway domain
if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    export VITE_API_URL="https://$RAILWAY_PUBLIC_DOMAIN"
else
    export VITE_API_URL="https://spinelineweb-production.up.railway.app"
fi

echo "Setting VITE_API_URL to: $VITE_API_URL"

# Run environment check
node check-env.js

# Build the frontend
NODE_ENV=production npm run build

# Install backend dependencies
cd ../backend
npm install --production

echo "=== Build Script Complete ==="
