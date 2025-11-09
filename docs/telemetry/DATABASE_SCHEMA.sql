/**
 * PhysioAssist Telemetry Database Schema
 *
 * PostgreSQL schema for production telemetry backend.
 * Optimized for time-series data with automatic partitioning and retention policies.
 *
 * Database: PostgreSQL 14+ with TimescaleDB extension
 * Retention: 90 days for raw events, 1 year for aggregated metrics
 *
 * @gate Gate 5 - Telemetry
 */

-- ============================================================================
-- Extensions
-- ============================================================================

-- Enable TimescaleDB for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for automated retention policies
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE exercise_mode AS ENUM ('async', 'live');
CREATE TYPE thermal_state AS ENUM ('nominal', 'fair', 'serious', 'critical');
CREATE TYPE error_severity AS ENUM ('warning', 'critical');
CREATE TYPE network_operation AS ENUM ('youtube_download', 'video_upload', 'report_share');

-- ============================================================================
-- Tables
-- ============================================================================

/**
 * Aggregated Telemetry
 *
 * 1-hour aggregated metrics (primary query table)
 */
CREATE TABLE aggregated_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    window_duration_ms BIGINT NOT NULL,

    -- Performance metrics
    inference_count INTEGER NOT NULL DEFAULT 0,
    inference_mean_ms DECIMAL(10, 2),
    inference_p50_ms DECIMAL(10, 2),
    inference_p95_ms DECIMAL(10, 2),
    inference_p99_ms DECIMAL(10, 2),
    inference_stddev_ms DECIMAL(10, 2),

    -- Frame processing
    total_frames INTEGER NOT NULL DEFAULT 0,
    dropped_frames INTEGER NOT NULL DEFAULT 0,
    average_fps DECIMAL(10, 2),

    -- Network
    network_requests INTEGER NOT NULL DEFAULT 0,
    network_success INTEGER NOT NULL DEFAULT 0,
    network_failed INTEGER NOT NULL DEFAULT 0,
    network_bytes_transferred BIGINT NOT NULL DEFAULT 0,
    network_avg_duration_ms DECIMAL(10, 2),

    -- Errors
    total_errors INTEGER NOT NULL DEFAULT 0,
    warning_errors INTEGER NOT NULL DEFAULT 0,
    critical_errors INTEGER NOT NULL DEFAULT 0,
    top_errors JSONB, -- {type: string, count: number}[]

    -- Device
    device_models JSONB, -- {model: count}
    os_versions JSONB, -- {version: count}
    thermal_states JSONB, -- {state: count}
    avg_battery_level DECIMAL(5, 4),
    thermal_throttle_count INTEGER NOT NULL DEFAULT 0,
    memory_warning_count INTEGER NOT NULL DEFAULT 0,

    -- Sessions
    total_sessions INTEGER NOT NULL DEFAULT 0,
    sessions_by_exercise JSONB, -- {exercise: count}
    sessions_async INTEGER NOT NULL DEFAULT 0,
    sessions_live INTEGER NOT NULL DEFAULT 0,
    avg_overall_score DECIMAL(10, 2),
    avg_sync_confidence DECIMAL(5, 4),
    avg_speed_ratio DECIMAL(5, 2),
    avg_processing_time_ms DECIMAL(10, 2),

    -- Metadata
    raw_event_count INTEGER NOT NULL DEFAULT 0,
    compression_ratio DECIMAL(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('aggregated_telemetry', 'window_start');

-- Create indexes
CREATE INDEX idx_aggregated_window_start ON aggregated_telemetry (window_start DESC);
CREATE INDEX idx_aggregated_created_at ON aggregated_telemetry (created_at DESC);

/**
 * Raw Session Events
 *
 * Individual session completion events (retained for 90 days)
 */
CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    anonymous_user_id VARCHAR(255), -- SHA-256 hash
    timestamp TIMESTAMPTZ NOT NULL,

    -- Session details
    exercise_type VARCHAR(100) NOT NULL,
    mode exercise_mode NOT NULL,

    -- Performance metrics
    inference_duration_ms INTEGER,
    dtw_sync_duration_ms INTEGER,
    total_processing_time_ms INTEGER,

    -- Accuracy metrics
    sync_confidence DECIMAL(5, 4),
    speed_ratio DECIMAL(5, 2),
    overall_score INTEGER,

    -- Storage metrics
    youtube_video_size_mb DECIMAL(10, 2),
    patient_video_size_mb DECIMAL(10, 2),
    cache_hit BOOLEAN,

    -- Device context
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    battery_level DECIMAL(5, 4),
    thermal_state thermal_state,

    -- Error summary
    error_count INTEGER NOT NULL DEFAULT 0,
    critical_error_count INTEGER NOT NULL DEFAULT 0,
    top_error VARCHAR(255),

    -- Privacy metadata
    pii_scrubbed_fields JSONB,
    consent_version VARCHAR(20),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('session_events', 'timestamp');

-- Create indexes
CREATE INDEX idx_session_timestamp ON session_events (timestamp DESC);
CREATE INDEX idx_session_exercise_type ON session_events (exercise_type, timestamp DESC);
CREATE INDEX idx_session_mode ON session_events (mode, timestamp DESC);
CREATE INDEX idx_session_device_model ON session_events (device_model);

/**
 * Raw Error Events
 *
 * Individual error detection events
 */
CREATE TABLE error_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    anonymous_user_id VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,

    error_type VARCHAR(100) NOT NULL,
    severity error_severity NOT NULL,
    joint VARCHAR(50),
    deviation DECIMAL(10, 2),

    -- Privacy metadata
    consent_version VARCHAR(20),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('error_events', 'timestamp');

-- Create indexes
CREATE INDEX idx_error_timestamp ON error_events (timestamp DESC);
CREATE INDEX idx_error_type ON error_events (error_type, timestamp DESC);
CREATE INDEX idx_error_severity ON error_events (severity, timestamp DESC);
CREATE INDEX idx_error_joint ON error_events (joint, timestamp DESC);

/**
 * Raw Network Events
 *
 * Network operation telemetry
 */
CREATE TABLE network_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,

    operation network_operation NOT NULL,
    duration_ms INTEGER,
    bytes_transferred BIGINT,
    success BOOLEAN,
    error_code VARCHAR(100),
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('network_events', 'timestamp');

-- Create indexes
CREATE INDEX idx_network_timestamp ON network_events (timestamp DESC);
CREATE INDEX idx_network_operation ON network_events (operation, timestamp DESC);
CREATE INDEX idx_network_success ON network_events (success, timestamp DESC);

/**
 * Device Health Events
 *
 * Thermal throttling and memory warnings
 */
CREATE TABLE device_health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,

    event_type VARCHAR(50) NOT NULL, -- 'thermal_throttle' | 'memory_warning'
    state VARCHAR(50),
    action VARCHAR(255),

    device_model VARCHAR(100),
    os_version VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('device_health_events', 'timestamp');

-- Create indexes
CREATE INDEX idx_device_health_timestamp ON device_health_events (timestamp DESC);
CREATE INDEX idx_device_health_type ON device_health_events (event_type, timestamp DESC);

-- ============================================================================
-- Retention Policies
-- ============================================================================

-- Raw events: 90 days retention (HIPAA minimum)
SELECT add_retention_policy('session_events', INTERVAL '90 days');
SELECT add_retention_policy('error_events', INTERVAL '90 days');
SELECT add_retention_policy('network_events', INTERVAL '90 days');
SELECT add_retention_policy('device_health_events', INTERVAL '90 days');

-- Aggregated metrics: 1 year retention
SELECT add_retention_policy('aggregated_telemetry', INTERVAL '1 year');

-- ============================================================================
-- Continuous Aggregates (Real-Time Roll-Ups)
-- ============================================================================

/**
 * Hourly Performance Summary
 */
CREATE MATERIALIZED VIEW hourly_performance
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS hour,
    COUNT(*) as session_count,
    AVG(total_processing_time_ms) as avg_processing_time,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total_processing_time_ms) as p50_processing_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_processing_time_ms) as p95_processing_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_processing_time_ms) as p99_processing_time,
    AVG(sync_confidence) as avg_confidence,
    AVG(overall_score) as avg_score
FROM session_events
GROUP BY hour;

-- Refresh policy: update every 30 minutes
SELECT add_continuous_aggregate_policy('hourly_performance',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '30 minutes');

/**
 * Daily Error Summary
 */
CREATE MATERIALIZED VIEW daily_errors
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    error_type,
    severity,
    COUNT(*) as error_count,
    ARRAY_AGG(DISTINCT joint) as affected_joints
FROM error_events
GROUP BY day, error_type, severity;

-- Refresh policy: update every hour
SELECT add_continuous_aggregate_policy('daily_errors',
    start_offset => INTERVAL '7 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

/**
 * Device Performance by Model
 */
CREATE MATERIALIZED VIEW device_performance
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', timestamp) AS day,
    device_model,
    os_version,
    COUNT(*) as session_count,
    AVG(total_processing_time_ms) as avg_processing_time,
    AVG(battery_level) as avg_battery,
    SUM(CASE WHEN thermal_state IN ('serious', 'critical') THEN 1 ELSE 0 END) as thermal_issues
FROM session_events
GROUP BY day, device_model, os_version;

-- Refresh policy: update daily
SELECT add_continuous_aggregate_policy('device_performance',
    start_offset => INTERVAL '14 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

-- ============================================================================
-- Functions
-- ============================================================================

/**
 * Insert aggregated telemetry batch
 */
CREATE OR REPLACE FUNCTION insert_aggregated_telemetry(
    data JSONB
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO aggregated_telemetry (
        window_start,
        window_end,
        window_duration_ms,
        inference_count,
        inference_mean_ms,
        inference_p50_ms,
        inference_p95_ms,
        inference_p99_ms,
        inference_stddev_ms,
        total_frames,
        dropped_frames,
        average_fps,
        network_requests,
        network_success,
        network_failed,
        network_bytes_transferred,
        network_avg_duration_ms,
        total_errors,
        warning_errors,
        critical_errors,
        top_errors,
        device_models,
        os_versions,
        thermal_states,
        avg_battery_level,
        thermal_throttle_count,
        memory_warning_count,
        total_sessions,
        sessions_by_exercise,
        sessions_async,
        sessions_live,
        avg_overall_score,
        avg_sync_confidence,
        avg_speed_ratio,
        avg_processing_time_ms,
        raw_event_count,
        compression_ratio
    ) VALUES (
        (data->>'window_start')::TIMESTAMPTZ,
        (data->>'window_end')::TIMESTAMPTZ,
        (data->>'window_duration_ms')::BIGINT,
        (data->'performance'->'inference'->>'count')::INTEGER,
        (data->'performance'->'inference'->>'mean')::DECIMAL,
        (data->'performance'->'inference'->>'p50')::DECIMAL,
        (data->'performance'->'inference'->>'p95')::DECIMAL,
        (data->'performance'->'inference'->>'p99')::DECIMAL,
        (data->'performance'->'inference'->>'stddev')::DECIMAL,
        (data->'performance'->'frameProcessing'->>'totalFrames')::INTEGER,
        (data->'performance'->'frameProcessing'->>'droppedFrames')::INTEGER,
        (data->'performance'->'frameProcessing'->>'averageFPS')::DECIMAL,
        (data->'performance'->'network'->>'totalRequests')::INTEGER,
        (data->'performance'->'network'->>'successfulRequests')::INTEGER,
        (data->'performance'->'network'->>'failedRequests')::INTEGER,
        (data->'performance'->'network'->>'totalBytesTransferred')::BIGINT,
        (data->'performance'->'network'->>'averageDuration_ms')::DECIMAL,
        (data->'errors'->>'errorsByType')::JSONB->>'total',
        (data->'errors'->'errorsBySeverity'->>'warning')::INTEGER,
        (data->'errors'->'errorsBySeverity'->>'critical')::INTEGER,
        data->'errors'->'topErrors',
        data->'device'->'deviceModels',
        data->'device'->'osVersions',
        data->'device'->'thermalStates',
        (data->'device'->>'averageBatteryLevel')::DECIMAL,
        (data->'device'->>'thermalThrottleCount')::INTEGER,
        (data->'device'->>'memoryWarningCount')::INTEGER,
        (data->'sessions'->>'totalSessions')::INTEGER,
        data->'sessions'->'sessionsByExercise',
        (data->'sessions'->'sessionsByMode'->>'async')::INTEGER,
        (data->'sessions'->'sessionsByMode'->>'live')::INTEGER,
        (data->'sessions'->'averageMetrics'->>'overallScore')::DECIMAL,
        (data->'sessions'->'averageMetrics'->>'syncConfidence')::DECIMAL,
        (data->'sessions'->'averageMetrics'->>'speedRatio')::DECIMAL,
        (data->'sessions'->'averageMetrics'->>'processingTime_ms')::DECIMAL,
        (data->>'rawEventCount')::INTEGER,
        (data->>'compressionRatio')::DECIMAL
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grants (for application user)
-- ============================================================================

-- Create application user
CREATE USER physioassist_telemetry WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- Grant permissions
GRANT USAGE ON SCHEMA public TO physioassist_telemetry;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO physioassist_telemetry;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO physioassist_telemetry;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO physioassist_telemetry;
GRANT EXECUTE ON FUNCTION insert_aggregated_telemetry(JSONB) TO physioassist_telemetry;

-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Query 1: Get hourly performance metrics for last 24 hours
-- SELECT * FROM hourly_performance
-- WHERE hour >= NOW() - INTERVAL '24 hours'
-- ORDER BY hour DESC;

-- Query 2: Top 10 most common errors in last 7 days
-- SELECT error_type, SUM(error_count) as total
-- FROM daily_errors
-- WHERE day >= NOW() - INTERVAL '7 days'
-- GROUP BY error_type
-- ORDER BY total DESC
-- LIMIT 10;

-- Query 3: Device performance comparison
-- SELECT device_model, AVG(avg_processing_time) as avg_time, SUM(thermal_issues) as issues
-- FROM device_performance
-- WHERE day >= NOW() - INTERVAL '30 days'
-- GROUP BY device_model
-- ORDER BY avg_time ASC;
