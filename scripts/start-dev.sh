#!/bin/bash

# Kill any process on ports 3000, 8080, 5000
echo "Cleaning up ports..."
pkill -f "node.*3000" || true
pkill -f "node.*8080" || true
pkill -f "node.*5000" || true

# Wait a moment for ports to be released
sleep 2

# Start Next.js dev server on port 3000
echo "Starting Next.js dev server on port 3000..."
PORT=3000 npm run dev
