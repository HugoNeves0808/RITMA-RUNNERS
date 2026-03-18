CREATE TABLE IF NOT EXISTS admin_activity_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32),
    target_email VARCHAR(255),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_events_occurred_at
    ON admin_activity_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_events_type
    ON admin_activity_events (event_type);
