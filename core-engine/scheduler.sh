#!/bin/bash
# Scheduler - Run daily checks via cron
# 
# Add to crontab:
#   0 6 * * * cd /path/to/core-engine && ./scheduler.sh daily
#   0 8 * * 1 cd /path/to/core-engine && ./scheduler.sh weekly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="logs/scheduler-$(date +%Y%m%d).log"
mkdir -p logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

case "$1" in
    daily)
        log "=== DAILY RUN START ==="
        
        # Get all clients
        clients=$(ls -1 outputs/ 2>/dev/null | grep "client_" || echo "")
        
        if [ -z "$clients" ]; then
            log "No clients found in outputs/"
        else
            # Check rankings for each client
            log "Checking keyword rankings..."
            echo "$clients" | while read -r client_dir; do
                client_id=$(echo "$client_dir" | grep -o 'client_[0-9]*' || echo "")
                if [ -n "$client_id" ]; then
                    log "Processing $client_id..."
                    
                    # Check rankings
                    node monitor.js check "$client_id" >> "$LOG_FILE" 2>&1
                    
                    # Run alert checks
                    node lib/alert-system.js check "$client_id" >> "$LOG_FILE" 2>&1
                fi
            done
        fi
        
        # Generate daily summary
        log "Generating daily summary..."
        node lib/alert-system.js summary >> "$LOG_FILE" 2>&1
        
        log "=== DAILY RUN COMPLETE ==="
        ;;
        
    weekly)
        log "=== WEEKLY RUN START ==="
        
        # Generate weekly reports for all clients
        log "Generating weekly reports..."
        
        clients=$(ls -1 outputs/ 2>/dev/null | grep "client_" || echo "")
        
        if [ -z "$clients" ]; then
            log "No clients found"
        else
            echo "$clients" | while read -r client_dir; do
                client_id=$(echo "$client_dir" | grep -o 'client_[0-9]*' || echo "")
                if [ -n "$client_id" ]; then
                    log "Generating report for $client_id..."
                    node monitor.js report "$client_id" >> "$LOG_FILE" 2>&1
                fi
            done
        fi
        
        # Competitor analysis
        log "Running competitor analysis..."
        
        clients=$(ls -1 outputs/ 2>/dev/null | grep "client_" || echo "")
        echo "$clients" | while read -r client_dir; do
            client_id=$(echo "$client_dir" | grep -o 'client_[0-9]*' || echo "")
            if [ -n "$client_id" ]; then
                node competitor.js analyze "$client_id" >> "$LOG_FILE" 2>&1
            fi
        done
        
        log "=== WEEKLY RUN COMPLETE ==="
        ;;
        
    now)
        # Immediate run - useful for testing
        log "=== IMMEDIATE RUN ==="
        
        if [ -n "$2" ]; then
            # Run for specific client
            log "Running checks for $2..."
            node monitor.js check "$2"
            node lib/alert-system.js check "$2"
        else
            # Run for all clients
            log "Running checks for all clients..."
            ./scheduler.sh daily
        fi
        
        log "=== RUN COMPLETE ==="
        ;;
        
    *)
        echo "Usage: scheduler.sh [daily|weekly|now] [client_id]"
        echo ""
        echo "Add to crontab:"
        echo "  # Daily at 6 AM"
        echo "  0 6 * * * cd $(pwd) && ./scheduler.sh daily"
        echo ""
        echo "  # Weekly on Monday at 8 AM"
        echo "  0 8 * * 1 cd $(pwd) && ./scheduler.sh weekly"
        ;;
esac
