#!/bin/bash
#
# Run GEO Auto-Iteration Engine
# This script is called by cron to check for new implementation requirements

cd /root/.openclaw/workspace-geo-arch/core-engine

# Load environment variables
export SUPABASE_URL=https://fixemvsckapejyfwphft.supabase.co
export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeGVtdnNja2FwZWp5ZndwaGZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkxNDczNSwiZXhwIjoyMDg3NDkwNzM1fQ.q_mgJQlae4B0AJMv9RziN2MzjVRKylG-06WIKFoG434

# Run the iteration engine
node scripts/auto-iteration-engine.js 2>&1 | tee -a /var/log/geo-iteration.log
