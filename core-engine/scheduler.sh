#!/bin/bash
# Scheduler - Run daily checks via cron
# 
# Add to crontab:
#   0 6 * * * cd /path/to/core-engine && ./scheduler.sh daily

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
        
        # Check all keyword rankings
        log "Checking keyword rankings..."
        node monitor.js run >> "$LOG_FILE" 2>&1
        
        # Check for significant changes (>3 positions)
        log "Checking for ranking alerts..."
        node scheduler.js check-alerts >> "$LOG_FILE" 2>&1
        
        log "=== DAILY RUN COMPLETE ==="
        ;;
        
    weekly)
        log "=== WEEKLY RUN START ==="
        
        # Generate weekly reports for all clients
        log "Generating weekly reports..."
        node scheduler.js weekly-reports >> "$LOG_FILE" 2>&1
        
        # Competitor analysis
        log "Analyzing competitors..."
        node scheduler.js competitor-analysis >> "$LOG_FILE" 2>&1
        
        log "=== WEEKLY RUN COMPLETE ==="
        ;;
        
    *)
        echo "Usage: scheduler.sh [daily|weekly]"
        echo ""
        echo "Add to crontab:"
        echo "  # Daily at 6 AM"
        echo "  0 6 * * * cd $(pwd) && ./scheduler.sh daily"
        echo ""
        echo "  # Weekly on Monday at 8 AM"
        echo "  0 8 * * 1 cd $(pwd) && ./scheduler.sh weekly"
        ;;
esac
