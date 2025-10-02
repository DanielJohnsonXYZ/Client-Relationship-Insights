-- Database Performance Optimizations
-- Run this after the initial schema to improve query performance

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for user + timestamp queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_emails_user_timestamp
  ON emails(user_id, timestamp DESC);

-- Composite index for client insights queries
CREATE INDEX IF NOT EXISTS idx_insights_client_category
  ON insights(client_id, category) WHERE client_id IS NOT NULL;

-- Index for feedback filtering
CREATE INDEX IF NOT EXISTS idx_insights_feedback
  ON insights(feedback) WHERE feedback IS NOT NULL;

-- Partial index for unprocessed emails (if you add a processed flag later)
-- CREATE INDEX IF NOT EXISTS idx_emails_unprocessed
--   ON emails(user_id, created_at) WHERE processed = false;

-- Index for email search by sender/recipient
CREATE INDEX IF NOT EXISTS idx_emails_from
  ON emails(from_email);

CREATE INDEX IF NOT EXISTS idx_emails_to
  ON emails(to_email);

-- ============================================================================
-- MATERIALIZED VIEW FOR DASHBOARD STATS (Optional Performance Boost)
-- ============================================================================

-- Create a materialized view for frequently accessed dashboard statistics
-- Refresh this periodically or after major data changes

CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT
  e.user_id,
  COUNT(DISTINCT e.id) as total_emails,
  COUNT(DISTINCT e.thread_id) as total_threads,
  COUNT(DISTINCT e.client_id) FILTER (WHERE e.client_id IS NOT NULL) as clients_with_emails,
  COUNT(DISTINCT i.id) as total_insights,
  COUNT(DISTINCT i.id) FILTER (WHERE i.category = 'Risk') as risk_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.category = 'Upsell') as upsell_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.category = 'Alignment') as alignment_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.category = 'Note') as note_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.feedback = 'positive') as positive_feedback_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.feedback = 'negative') as negative_feedback_count,
  MAX(e.timestamp) as last_email_timestamp,
  MAX(i.created_at) as last_insight_timestamp
FROM emails e
LEFT JOIN insights i ON i.email_id = e.id
GROUP BY e.user_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_user
  ON dashboard_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATABASE MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old rate limit data (if using DB-based rate limiting)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- This is a placeholder - adjust based on your rate limiting implementation
  -- DELETE FROM rate_limits WHERE expires_at < NOW();
  -- GET DIAGNOSTICS deleted_count = ROW_COUNT;
  deleted_count := 0;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze and optimize tables
CREATE OR REPLACE FUNCTION vacuum_and_analyze_tables()
RETURNS void AS $$
BEGIN
  VACUUM ANALYZE emails;
  VACUUM ANALYZE insights;
  VACUUM ANALYZE clients;
  VACUUM ANALYZE gmail_accounts;
  VACUUM ANALYZE user_profiles;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY PERFORMANCE MONITORING
-- ============================================================================

-- View to monitor slow queries (requires pg_stat_statements extension)
-- Uncomment if you have pg_stat_statements enabled

-- CREATE OR REPLACE VIEW slow_queries AS
-- SELECT
--   query,
--   calls,
--   total_exec_time,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- WHERE mean_exec_time > 100  -- queries taking more than 100ms on average
-- ORDER BY mean_exec_time DESC
-- LIMIT 50;

-- ============================================================================
-- TABLE STATISTICS
-- ============================================================================

-- View to monitor table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================

-- To use the dashboard stats materialized view:
-- 1. Refresh it periodically (e.g., via a cron job or after bulk operations):
--    SELECT refresh_dashboard_stats();
--
-- 2. Query it like a normal table:
--    SELECT * FROM dashboard_stats WHERE user_id = 'xxx';
--
-- To maintain database performance:
-- 1. Run VACUUM ANALYZE periodically:
--    SELECT vacuum_and_analyze_tables();
--
-- 2. Monitor table sizes:
--    SELECT * FROM table_sizes;
--
-- To check index usage:
--    SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
