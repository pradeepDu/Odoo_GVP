#!/bin/bash

# Cleanup script to kill duplicate backend instances
# This runs before each nodemon restart

# Find and kill duplicate ts-node processes (keep only the current one)
CURRENT_PID=$$
PARENT_PID=$PPID

# Kill other ts-node instances running index.ts (except current process tree)
for pid in $(pgrep -f "ts-node.*index.ts"); do
    if [ "$pid" != "$CURRENT_PID" ] && [ "$pid" != "$PARENT_PID" ]; then
        # Check if it's not part of current process tree
        if ! pstree $PARENT_PID 2>/dev/null | grep -q $pid; then
            kill -9 $pid 2>/dev/null
        fi
    fi
done

exit 0
