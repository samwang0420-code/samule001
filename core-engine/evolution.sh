#!/bin/bash
# Evolution System - 系统进化工作流
# 
# Usage: ./evolution.sh [daily|weekly|apply]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

case "$1" in
    daily)
        log "=== EVOLUTION DAILY CHECK ==="
        
        # 1. 检查外部信号
        log "Checking external signals..."
        node lib/signal-monitor.js scan > logs/signals-$(date +%Y%m%d).log 2>&1
        
        # 2. 检查策略效果
        log "Analyzing strategy outcomes..."
        node lib/outcome-tracker.js report > logs/outcomes-$(date +%Y%m%d).log 2>&1
        
        # 3. 生成更新计划
        log "Generating knowledge update plan..."
        node knowledge-update.js > logs/update-plan-$(date +%Y%m%d).log 2>&1
        
        # 4. 如果有高风险信号，发送告警
        if grep -q "CRITICAL" logs/signals-$(date +%Y%m%d).log 2>/dev/null; then
            log "⚠️  CRITICAL signals detected! Check logs/signals-$(date +%Y%m%d).log"
        fi
        
        log "=== DAILY CHECK COMPLETE ==="
        ;;
        
    weekly)
        log "=== EVOLUTION WEEKLY REVIEW ==="
        
        # 1. 完整报告
        log "Generating weekly evolution report..."
        
        echo "\n## Signal Monitoring" > logs/weekly-report-$(date +%Y%m%d).md
        node lib/signal-monitor.js list >> logs/weekly-report-$(date +%Y%m%d).md 2>&1
        
        echo "\n## Strategy Effectiveness" >> logs/weekly-report-$(date +%Y%m%d).md
        node lib/outcome-tracker.js report >> logs/weekly-report-$(date +%Y%m%d).md 2>&1
        
        echo "\n## Knowledge Update Recommendations" >> logs/weekly-report-$(date +%Y%m%d).md
        node lib/outcome-tracker.js recommend >> logs/weekly-report-$(date +%Y%m%d).md 2>&1
        
        # 2. 如果有待执行的更新，提醒
        if [ -f "knowledge-base/pending-update.json" ]; then
            log "⚡ Pending knowledge update found!"
            log "   Review with: node knowledge-update.js status"
            log "   Apply with: ./evolution.sh apply"
        fi
        
        log "=== WEEKLY REVIEW COMPLETE ==="
        log "Report saved to: logs/weekly-report-$(date +%Y%m%d).md"
        ;;
        
    apply)
        log "=== APPLYING KNOWLEDGE UPDATE ==="
        node knowledge-update.js apply
        log "=== UPDATE APPLIED ==="
        ;;
        
    status)
        echo "=== EVOLUTION SYSTEM STATUS ==="
        node knowledge-update.js status
        echo ""
        echo "Recent signals:"
        node lib/signal-monitor.js list
        ;;
        
    *)
        echo "Evolution System - 系统自我进化"
        echo ""
        echo "Usage: ./evolution.sh [daily|weekly|apply|status]"
        echo ""
        echo "Commands:"
        echo "  daily   - Run daily evolution check"
        echo "  weekly  - Generate weekly evolution report"
        echo "  apply   - Apply pending knowledge update"
        echo "  status  - Check evolution system status"
        echo ""
        echo "Add to crontab:"
        echo "  # Daily at 7 AM"
        echo "  0 7 * * * cd $(pwd) \u0026\u0026 ./evolution.sh daily"
        echo ""
        echo "  # Weekly on Monday at 9 AM"
        echo "  0 9 * * 1 cd $(pwd) \u0026\u0026 ./evolution.sh weekly"
        ;;
esac
