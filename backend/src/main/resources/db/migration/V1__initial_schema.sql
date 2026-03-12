CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'race_status') THEN
        CREATE TYPE race_status AS ENUM (
            'IN_LIST',
            'REGISTERED',
            'NOT_REGISTERED',
            'COMPLETED',
            'CANCELLED',
            'DID_NOT_START',
            'DID_NOT_FINISH'
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_email_not_blank CHECK (btrim(email) <> ''),
    CONSTRAINT chk_users_password_hash_not_blank CHECK (btrim(password_hash) <> '')
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    show_next_race_notification BOOLEAN NOT NULL DEFAULT TRUE,
    sidebar_collapsed_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_shoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_shoes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_shoes_user_name UNIQUE (user_id, name),
    CONSTRAINT chk_user_shoes_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE user_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_teams_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_teams_user_name UNIQUE (user_id, name),
    CONSTRAINT chk_user_teams_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE user_circuits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_circuits_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_circuits_user_name UNIQUE (user_id, name),
    CONSTRAINT chk_user_circuits_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE user_race_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_race_types_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_race_types_user_name UNIQUE (user_id, name),
    CONSTRAINT chk_user_race_types_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE user_races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    race_status race_status NOT NULL,
    race_date DATE,
    race_time TIME,
    name VARCHAR(150) NOT NULL,
    team_id UUID,
    circuit_id UUID,
    race_type_id UUID,
    real_km NUMERIC(5,2),
    elevation INTEGER,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_valid_for_category_ranking BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_user_races_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_races_team
        FOREIGN KEY (team_id) REFERENCES user_teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_races_circuit
        FOREIGN KEY (circuit_id) REFERENCES user_circuits(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_races_race_type
        FOREIGN KEY (race_type_id) REFERENCES user_race_types(id) ON DELETE SET NULL,
    CONSTRAINT chk_user_races_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_user_races_real_km_non_negative CHECK (real_km IS NULL OR real_km >= 0),
    CONSTRAINT chk_user_races_elevation_non_negative CHECK (elevation IS NULL OR elevation >= 0)
);

CREATE TABLE user_race_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_race_id UUID NOT NULL,
    shoe_id UUID,
    official_time INTEGER,
    chip_time INTEGER,
    pace_per_km INTEGER,
    general_classification INTEGER,
    is_general_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    age_group_classification INTEGER,
    is_age_group_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    team_classification INTEGER,
    is_team_classification_podium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_race_results_user_race UNIQUE (user_race_id),
    CONSTRAINT fk_user_race_results_user_race
        FOREIGN KEY (user_race_id) REFERENCES user_races(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_race_results_shoe
        FOREIGN KEY (shoe_id) REFERENCES user_shoes(id) ON DELETE SET NULL,
    CONSTRAINT chk_user_race_results_official_time_non_negative CHECK (official_time IS NULL OR official_time >= 0),
    CONSTRAINT chk_user_race_results_chip_time_non_negative CHECK (chip_time IS NULL OR chip_time >= 0),
    CONSTRAINT chk_user_race_results_pace_per_km_non_negative CHECK (pace_per_km IS NULL OR pace_per_km >= 0),
    CONSTRAINT chk_user_race_results_general_classification_positive CHECK (general_classification IS NULL OR general_classification > 0),
    CONSTRAINT chk_user_race_results_age_group_classification_positive CHECK (age_group_classification IS NULL OR age_group_classification > 0),
    CONSTRAINT chk_user_race_results_team_classification_positive CHECK (team_classification IS NULL OR team_classification > 0)
);

CREATE TABLE user_race_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_race_id UUID NOT NULL,
    pre_race_confidence VARCHAR(30),
    race_difficulty VARCHAR(30),
    final_satisfaction VARCHAR(30),
    pain_injuries TEXT,
    analysis_notes TEXT,
    would_repeat_this_race BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_race_analysis_user_race UNIQUE (user_race_id),
    CONSTRAINT fk_user_race_analysis_user_race
        FOREIGN KEY (user_race_id) REFERENCES user_races(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_shoes_user_id ON user_shoes (user_id);
CREATE INDEX idx_user_teams_user_id ON user_teams (user_id);
CREATE INDEX idx_user_circuits_user_id ON user_circuits (user_id);
CREATE INDEX idx_user_race_types_user_id ON user_race_types (user_id);
CREATE INDEX idx_user_races_user_id ON user_races (user_id);
CREATE INDEX idx_user_races_team_id ON user_races (team_id);
CREATE INDEX idx_user_races_circuit_id ON user_races (circuit_id);
CREATE INDEX idx_user_races_race_type_id ON user_races (race_type_id);
CREATE INDEX idx_user_races_race_date ON user_races (race_date);
CREATE INDEX idx_user_race_results_shoe_id ON user_race_results (shoe_id);
CREATE UNIQUE INDEX uq_users_email_lower ON users ((lower(email)));

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_settings_set_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_shoes_set_updated_at
BEFORE UPDATE ON user_shoes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_teams_set_updated_at
BEFORE UPDATE ON user_teams
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_circuits_set_updated_at
BEFORE UPDATE ON user_circuits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_race_types_set_updated_at
BEFORE UPDATE ON user_race_types
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_races_set_updated_at
BEFORE UPDATE ON user_races
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_race_results_set_updated_at
BEFORE UPDATE ON user_race_results
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_race_analysis_set_updated_at
BEFORE UPDATE ON user_race_analysis
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
