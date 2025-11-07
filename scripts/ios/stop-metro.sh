#!/bin/bash

################################################################################
# Stop Metro Bundler Script
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Metro bundler...${NC}"

# Stop Metro via PID file
if [ -f /tmp/physioassist_metro.pid ]; then
    METRO_PID=$(cat /tmp/physioassist_metro.pid)
    if ps -p $METRO_PID > /dev/null 2>&1; then
        kill $METRO_PID
        rm /tmp/physioassist_metro.pid
        echo -e "${GREEN}✓ Metro stopped (PID: $METRO_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Metro not running (stale PID file)${NC}"
        rm /tmp/physioassist_metro.pid
    fi
else
    # Fallback: kill any Metro process on port 8081
    METRO_PID=$(lsof -ti:8081)
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID
        echo -e "${GREEN}✓ Metro stopped (PID: $METRO_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  Metro bundler not running${NC}"
    fi
fi
