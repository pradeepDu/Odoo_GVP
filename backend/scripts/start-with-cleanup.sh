#!/bin/bash

# Wrapper script for nodemon - ensures clean start on each restart
# Kills any duplicate backend instances before starting

echo "🧹 Checking for duplicate processes..."

# Get current script and parent PIDs to avoid killing ourselves
SCRIPT_PID=$$
PARENT_PID=$PPID
GRANDPARENT_PID=$(ps -o ppid= -p $PARENT_PID | tr -d ' ')

# Find all ts-node processes running index.ts
found_duplicates=false
for pid in $(pgrep -f "ts-node.*index.ts" 2>/dev/null); do
    # Skip if it's us or our parents
    if [ "$pid" != "$SCRIPT_PID" ] && [ "$pid" != "$PARENT_PID" ] && [ "$pid" != "$GRANDPARENT_PID" ]; then
        # Additional check: skip if PID is in our process tree
        if ! ps -o pid= --ppid $GRANDPARENT_PID 2>/dev/null | grep -q "^[[:space:]]*$pid$"; then
            echo "  ⚠️  Killing duplicate process: $pid"
            kill -9 $pid 2>/dev/null
            found_duplicates=true
        fi
    fi
done

if [ "$found_duplicates" = false ]; then
    echo "  ✓ No duplicates found"
fi

echo ""

# Start the actual server
exec ts-node --transpile-only index.ts
