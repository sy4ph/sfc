#!/bin/bash

# Start the Python backend in the background
echo "Starting backend on port 5000..."
# Use factory function syntax: module:create_app()
# Increased timeout to 300s for complex calculations
gunicorn 'backend.app:create_app()' --bind 0.0.0.0:5000 --workers=2 --timeout=300 &

# Start the Next.js frontend
echo "Starting frontend on port ${PORT:-10000}..."
# Next.js standalone requires HOSTNAME=0.0.0.0 and PORT
export PORT=${PORT:-10000}
export HOSTNAME="0.0.0.0"
# server.js is at the root /app level
node server.js
