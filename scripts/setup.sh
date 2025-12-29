#!/bin/bash

# AI Tool Marketplace - Setup Script
# This script sets up the development environment

set -e

echo "========================================"
echo "AI Tool Marketplace - Setup Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker installed${NC}"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker Compose installed${NC}"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Node.js is not installed (optional for local development)${NC}"
    else
        echo -e "${GREEN}✓ Node.js installed ($(node -v))${NC}"
    fi

    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}Python3 is not installed (optional for local development)${NC}"
    else
        echo -e "${GREEN}✓ Python3 installed ($(python3 --version))${NC}"
    fi
}

# Setup environment files
setup_env_files() {
    echo -e "\n${YELLOW}Setting up environment files...${NC}"

    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env${NC}"
        echo -e "${YELLOW}  Please update backend/.env with your configuration${NC}"
    else
        echo -e "${GREEN}✓ backend/.env already exists${NC}"
    fi

    # Frontend .env
    if [ ! -f "frontend/.env.local" ]; then
        cp frontend/.env.example frontend/.env.local
        echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
    else
        echo -e "${GREEN}✓ frontend/.env.local already exists${NC}"
    fi

    # Docker .env
    if [ ! -f "docker/.env" ]; then
        cp docker/.env.example docker/.env
        echo -e "${GREEN}✓ Created docker/.env${NC}"
        echo -e "${YELLOW}  Please update docker/.env with your configuration${NC}"
    else
        echo -e "${GREEN}✓ docker/.env already exists${NC}"
    fi
}

# Start services with Docker
start_docker_services() {
    echo -e "\n${YELLOW}Starting Docker services...${NC}"

    cd docker

    # Start in development mode
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

    echo -e "${GREEN}✓ Docker services started${NC}"

    # Wait for services to be healthy
    echo -e "\n${YELLOW}Waiting for services to be ready...${NC}"
    sleep 10

    # Check service status
    docker-compose ps

    cd ..
}

# Run database migrations
run_migrations() {
    echo -e "\n${YELLOW}Running database migrations...${NC}"

    cd backend

    # Create virtual environment if needed
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi

    # Activate and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt

    # Run Alembic migrations
    alembic upgrade head

    deactivate

    cd ..

    echo -e "${GREEN}✓ Database migrations completed${NC}"
}

# Seed initial data
seed_data() {
    echo -e "\n${YELLOW}Seeding initial data...${NC}"

    # This would run a seed script
    # python3 backend/scripts/seed.py

    echo -e "${GREEN}✓ Initial data seeded${NC}"
}

# Print success message
print_success() {
    echo -e "\n${GREEN}========================================"
    echo "Setup completed successfully!"
    echo "========================================${NC}"
    echo ""
    echo "Services are running at:"
    echo "  - Frontend:  http://localhost:3000"
    echo "  - Backend:   http://localhost:8000"
    echo "  - API Docs:  http://localhost:8000/docs"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis:     localhost:6379"
    echo "  - Qdrant:    localhost:6333"
    echo ""
    echo "To stop services: cd docker && docker-compose down"
    echo "To view logs: cd docker && docker-compose logs -f"
}

# Main execution
main() {
    check_prerequisites
    setup_env_files
    start_docker_services
    # run_migrations  # Uncomment when migrations are set up
    # seed_data       # Uncomment when seed script is ready
    print_success
}

main "$@"
