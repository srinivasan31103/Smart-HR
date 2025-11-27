#!/bin/bash

# Smart HR System - Automated Setup Script
# This script automates the setup process for development environment

set -e  # Exit on error

echo "=================================="
echo "  Smart HR System Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js installation... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Found $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js v16+ from https://nodejs.org/"
    exit 1
fi

# Check MongoDB
echo -n "Checking MongoDB installation... "
if command -v mongod &> /dev/null || command -v mongo &> /dev/null || command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${YELLOW}⚠ MongoDB not found in PATH${NC}"
    echo "Make sure MongoDB is installed and running"
fi

echo ""
echo "=================================="
echo "  Backend Setup"
echo "=================================="

# Backend setup
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists, skipping${NC}"
fi

echo "Installing backend dependencies..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..

echo ""
echo "=================================="
echo "  Frontend Setup"
echo "=================================="

# Frontend setup
cd frontend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists, skipping${NC}"
fi

echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

echo ""
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start MongoDB:"
echo "   - macOS: brew services start mongodb-community"
echo "   - Linux: sudo systemctl start mongod"
echo "   - Windows: net start MongoDB"
echo ""
echo "2. Start Backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. Start Frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Create test account:"
echo "   Follow instructions in QUICK_START.md"
echo ""
echo "5. Open browser:"
echo "   http://localhost:3000"
echo ""
echo "For detailed instructions, see QUICK_START.md"
echo ""
