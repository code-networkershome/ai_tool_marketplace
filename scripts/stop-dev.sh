#!/bin/bash

# Stop development environment

echo "Stopping AI Tool Marketplace..."

cd docker
docker-compose down

echo "Services stopped."
