#!/bin/bash
# Smoke Test Script for Student Flow UX Fixes
# Run this after implementing Master's fixes to verify everything works

set -e

echo "=========================================="
echo "Student Flow - Smoke Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo "✓ Testing against: $BASE_URL"
echo ""

# Test 1: Create Project
echo "Test 1: Create Project via API"
echo "-----------------------------"

RESPONSE=$(curl -s -X POST "$BASE_URL/api/student/project/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smoke Test Project",
    "elevator": "Quick smoke test",
    "must_have_features": ["auth", "crud"],
    "team_size": 2,
    "members": [],
    "appType": "web",
    "skillLevel": "beginner"
  }')

PROJECT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}✗ Failed to create project${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Project created: $PROJECT_ID${NC}"
echo ""

# Test 2: Trigger Snapshot Generation
echo "Test 2: Trigger Snapshot Generation"
echo "------------------------------------"

SEED_RESPONSE=$(curl -s -X POST "$BASE_URL/api/student/project/$PROJECT_ID/seed" \
  -H "Content-Type: application/json")

echo "Seed response: $SEED_RESPONSE"

if echo "$SEED_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Seed job triggered${NC}"
else
  echo -e "${YELLOW}⚠ Seed job may have failed (check server logs)${NC}"
fi
echo ""

# Test 3: Poll for Snapshot (with timeout)
echo "Test 3: Poll for Snapshot Readiness"
echo "------------------------------------"

MAX_ATTEMPTS=25
ATTEMPT=0
SNAPSHOT_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  
  SNAPSHOT_RESPONSE=$(curl -s "$BASE_URL/api/student/project/$PROJECT_ID/snapshot?mode=latest")
  
  if echo "$SNAPSHOT_RESPONSE" | grep -q '"ready":true'; then
    SNAPSHOT_READY=true
    echo -e "${GREEN}✓ Snapshot ready after $ATTEMPT attempts${NC}"
    break
  fi
  
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - Snapshot not ready yet..."
  sleep 1
done

if [ "$SNAPSHOT_READY" = false ]; then
  echo -e "${RED}✗ Snapshot never became ready after $MAX_ATTEMPTS attempts${NC}"
  echo "Last response: $SNAPSHOT_RESPONSE"
  exit 1
fi
echo ""

# Test 4: Verify Snapshot Structure
echo "Test 4: Verify Snapshot Structure"
echo "----------------------------------"

NODES_COUNT=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"nodes":\[' | wc -l)
EDGES_COUNT=$(echo "$SNAPSHOT_RESPONSE" | grep -o '"edges":\[' | wc -l)

if [ "$NODES_COUNT" -gt 0 ] && [ "$EDGES_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Snapshot has nodes and edges${NC}"
else
  echo -e "${RED}✗ Snapshot structure invalid${NC}"
  exit 1
fi
echo ""

# Test 5: Verify Debug Endpoints (dev only)
echo "Test 5: Check Debug Endpoints"
echo "------------------------------"

LOGS_RESPONSE=$(curl -s "$BASE_URL/api/student/project/$PROJECT_ID/logs")

if echo "$LOGS_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Logs endpoint working${NC}"
else
  echo -e "${YELLOW}⚠ Logs endpoint returned unexpected response${NC}"
fi
echo ""

# Test 6: Export Project Data
echo "Test 6: Export Project Data"
echo "----------------------------"

EXPORT_RESPONSE=$(curl -s "$BASE_URL/api/student/project/$PROJECT_ID/export")

if echo "$EXPORT_RESPONSE" | grep -q '"project"'; then
  echo -e "${GREEN}✓ Project export working${NC}"
else
  echo -e "${RED}✗ Project export failed${NC}"
  exit 1
fi
echo ""

# Summary
echo "=========================================="
echo "Smoke Test Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Project ID: $PROJECT_ID"
echo ""
echo "Manual verification steps:"
echo "1. Open http://localhost:3000/student/$PROJECT_ID/proposal"
echo "2. Check BuilderStatusPanel shows 'Snapshot ready' (green)"
echo "3. Click 'Open Editor' - should load instantly via sessionStorage"
echo "4. Verify canvas shows nodes and edges"
echo ""
echo "If editor fails to load:"
echo "- Check sessionStorage for key: snapshot:$PROJECT_ID"
echo "- View logs: http://localhost:3000/api/student/project/$PROJECT_ID/logs"
echo "- Check server terminal for [builder] logs"
echo ""
