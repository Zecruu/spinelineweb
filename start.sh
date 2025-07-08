#!/bin/bash
set -e

echo "=== SpineLine Startup Script ==="
echo "Environment: $NODE_ENV"
echo "Current directory: $(pwd)"

# Check if frontend build exists
if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
    echo "Frontend build not found. Building frontend..."
    
    cd frontend
    
    # Set environment variables for build
    if [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
        export VITE_API_URL="https://$RAILWAY_PUBLIC_DOMAIN"
    else
        export VITE_API_URL="${VITE_API_URL:-https://spinelineweb-production.up.railway.app}"
    fi
    echo "Building with VITE_API_URL: $VITE_API_URL"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    echo "Building frontend..."
    npm run build
    
    # Verify build
    if [ ! -f "dist/index.html" ]; then
        echo "ERROR: Frontend build failed!"
        exit 1
    fi
    
    echo "Frontend build successful!"
    cd ..
else
    echo "Frontend build already exists."
fi

# Start the backend server
echo "Starting backend server..."
cd backend
exec node server.js
