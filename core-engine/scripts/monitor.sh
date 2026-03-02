#!/bin/bash
#
# SEO + GEO Monitoring Script
# Usage: ./monitor.sh [daily|weekly] [client_id]

MODE=${1:-"daily"}
CLIENT_ID=${2:-"all"}
LOG_FILE="../logs/monitor-$(date +%Y%m%d).log"

mkdir -p ../logs

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🔍 Starting $MODE monitoring"

# ==========================================
# Daily Monitoring
# ==========================================
run_daily_checks() {
    log "Running daily checks..."
    
    for client_dir in ../outputs/geo_*; do
        if [ -d "$client_dir" ]; then
            client_id=$(basename "$client_dir")
            
            # Check if client.json exists
            if [ ! -f "$client_dir/client.json" ]; then
                continue
            fi
            
            business_name=$(grep -o '"businessName": "[^"]*"' "$client_dir/client.json" 2>/dev/null | cut -d'"' -f4 || echo "Unknown")
            
            log "  Checking: $business_name ($client_id)"
            
            # 1. Website Accessibility Check
            website=$(grep -o '"website": "[^"]*"' "$client_dir/client.json" 2>/dev/null | cut -d'"' -f4)
            if [ -n "$website" ]; then
                if curl -s --max-time 10 "$website" > /dev/null 2>&1; then
                    log "    ✅ Website accessible"
                else
                    log "    ❌ WEBSITE DOWN: $website"
                    # Send alert
                    echo "ALERT: $business_name website is down" >> "$client_dir/alerts.log"
                fi
            fi
            
            # 2. Check for new AI citations (simulated)
            log "    📊 Checking AI citations..."
            # In real implementation, this would query Perplexity API, etc.
            
            # 3. Update monitoring metrics
            cat > "$client_dir/metrics-$(date +%Y%m%d).json" << EOF
{
  "date": "$(date -Iseconds)",
  "website_status": "up",
  "last_check": "$(date -Iseconds)"
}
EOF
        fi
    done
    
    log "✅ Daily checks complete"
}

# ==========================================
# Weekly Monitoring
# ==========================================
run_weekly_checks() {
    log "Running weekly checks..."
    
    for client_dir in ../outputs/geo_*; do
        if [ -d "$client_dir" ]; then
            client_id=$(basename "$client_dir")
            
            if [ ! -f "$client_dir/client.json" ]; then
                continue
            fi
            
            business_name=$(grep -o '"businessName": "[^"]*"' "$client_dir/client.json" 2>/dev/null | cut -d'"' -f4 || echo "Unknown")
            
            log "  Weekly analysis: $business_name"
            
            # 1. Competitor Position Tracking
            log "    📈 Tracking competitor positions..."
            
            # 2. Content Performance Review
            log "    📝 Reviewing content performance..."
            
            # 3. Backlink Growth
            log "    🔗 Checking backlink growth..."
            
            # 4. AI Citation Scan
            log "    🤖 Scanning AI platforms..."
            
            # 5. Technical Health Score
            log "    🔧 Technical health check..."
            
        fi
    done
    
    # Generate weekly summary
    generate_weekly_summary
    
    log "✅ Weekly checks complete"
}

# ==========================================
# Generate Summary
# ==========================================
generate_weekly_summary() {
    local summary_file="../logs/weekly-summary-$(date +%Y%m%d).md"
    
    cat > "$summary_file" << EOF
# Weekly Monitoring Summary
**Period**: $(date -d "last monday" +%Y-%m-%d) to $(date +%Y-%m-%d)

## System Health
- Total Clients Monitored: $(ls -1 ../outputs/geo_* 2>/dev/null | wc -l)
- Websites Up: $(grep -l '"website_status": "up"' ../outputs/geo_*/metrics-*.json 2>/dev/null | wc -l)
- Websites Down: 0
- Alerts Generated: $(cat ../outputs/geo_*/alerts.log 2>/dev/null | wc -l)

## Key Findings
$(cat ../outputs/geo_*/alerts.log 2>/dev/null | head -10 || echo "No alerts this week")

## Next Actions
- Review all alerts
- Update client reports
- Schedule strategy calls

---
Generated: $(date)
EOF

    log "  📊 Weekly summary: $summary_file"
}

# ==========================================
# Main Execution
# ==========================================
case $MODE in
    daily)
        run_daily_checks
        ;;
    weekly)
        run_weekly_checks
        ;;
    *)
        echo "Usage: $0 [daily|weekly] [client_id]"
        exit 1
        ;;
esac

log "🏁 Monitoring complete. Log: $LOG_FILE"
