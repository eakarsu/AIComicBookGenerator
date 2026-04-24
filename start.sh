#!/bin/bash

# =============================================
#  AI Comic Book Generator - Startup Script
# =============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║    📚 AI Comic Book Generator            ║"
echo "  ║    AI-Powered Comic Book Studio          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found! Please create one.${NC}"
    exit 1
fi

PORT=${PORT:-3001}

# ===== Clean used ports =====
echo -e "\n${YELLOW}🔧 Cleaning used ports...${NC}"

# Kill any process on our app port
if lsof -i :$PORT -t > /dev/null 2>&1; then
    echo -e "${YELLOW}  Killing processes on port $PORT...${NC}"
    lsof -i :$PORT -t | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}  ✓ Port $PORT freed${NC}"
else
    echo -e "${GREEN}  ✓ Port $PORT is available${NC}"
fi

# ===== Check prerequisites =====
echo -e "\n${YELLOW}🔍 Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Node.js $(node -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL client not found. Please install PostgreSQL.${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ PostgreSQL client found${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
    echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    else
        sudo systemctl start postgresql 2>/dev/null || true
    fi
    sleep 2
    if ! pg_isready -q 2>/dev/null; then
        echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}  ✓ PostgreSQL is running${NC}"

# ===== Setup Database =====
echo -e "\n${YELLOW}🗄️  Setting up database...${NC}"

# Extract DB credentials from DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

# Create user if not exists
psql -h $DB_HOST -p $DB_PORT -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $(whoami) -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true

# Create database if not exists
psql -h $DB_HOST -p $DB_PORT -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $(whoami) -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true

# Grant privileges
psql -h $DB_HOST -p $DB_PORT -U $(whoami) -d postgres -c "ALTER USER $DB_USER WITH SUPERUSER;" 2>/dev/null || true

echo -e "${GREEN}  ✓ Database '$DB_NAME' ready${NC}"

# ===== Install dependencies =====
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}  ✓ Dependencies already installed${NC}"
    # Check for missing deps
    npm install --quiet 2>/dev/null
fi
echo -e "${GREEN}  ✓ Dependencies ready${NC}"

# ===== Seed Database =====
echo -e "\n${YELLOW}🌱 Seeding database with sample data...${NC}"
node server/seed.js
echo -e "${GREEN}  ✓ Database seeded successfully${NC}"

# ===== Start Application with Hot Reload =====
echo -e "\n${CYAN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Starting AI Comic Book Generator...${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e ""
echo -e "${BLUE}  🌐 App:      http://localhost:$PORT${NC}"
echo -e "${BLUE}  📊 API:      http://localhost:$PORT/api/health${NC}"
echo -e "${BLUE}  🔄 Mode:     Hot Reload (nodemon)${NC}"
echo -e ""
echo -e "${YELLOW}  Press Ctrl+C to stop${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

# Start with nodemon for hot reload (watches server and public directories)
npx nodemon \
    --watch server \
    --watch public \
    --ext js,html,css,json \
    --delay 1 \
    server/index.js
