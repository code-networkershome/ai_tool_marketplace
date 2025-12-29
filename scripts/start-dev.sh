#!/bin/bash

# Start development environment

echo "Starting AI Tool Marketplace - Development Mode"

cd docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

echo ""
echo "Services started!"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
echo "Watching logs..."
docker-compose logs -f
