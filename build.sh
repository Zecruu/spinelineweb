#!/bin/bash
set -e  # Exit on any error

echo "=== Build Script Starting ==="
echo "RAILWAY_PUBLIC_DOMAIN: $RAILWAY_PUBLIC_DOMAIN"
echo "NODE_ENV: $NODE_ENV"
echo "Current directory: $(pwd)"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf frontend/dist frontend/node_modules

# Install frontend dependencies
echo "Installing frontend dependencies..."
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
echo "Running environment check..."
node check-env.js

# Build the frontend
echo "Building frontend..."
NODE_ENV=production npm run build

# Verify build was successful
if [ ! -d "dist" ]; then
    echo "ERROR: Frontend build failed - dist directory not created"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "ERROR: Frontend build failed - index.html not found"
    exit 1
fi

echo "Frontend build successful!"
echo "Build directory contents:"
ls -la dist/

# Install backend dependencies
echo "Installing backend dependencies..."
cd ../backend
npm install --production

echo "=== Build Script Complete ==="
