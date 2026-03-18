CREATE TABLE IF NOT EXISTS user_access_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    platform VARCHAR(20) NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_access_events_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_access_events_platform
        CHECK (platform IN ('WEB', 'MOBILE', 'UNKNOWN'))
);

CREATE INDEX IF NOT EXISTS idx_user_access_events_platform_accessed_at
    ON user_access_events (platform, accessed_at);

CREATE INDEX IF NOT EXISTS idx_user_access_events_user_id
    ON user_access_events (user_id);
