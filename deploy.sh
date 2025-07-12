#!/bin/bash

echo "🚀 Starting SpineLine deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Build complete!"
echo "🌐 Starting server..."

# Start the server
cd backend
npm start
