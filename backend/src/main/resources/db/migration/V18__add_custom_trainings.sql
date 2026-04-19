CREATE TABLE user_custom_training_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_custom_training_types_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_custom_training_types_user_name UNIQUE (user_id, name),
    CONSTRAINT chk_user_custom_training_types_name_not_blank CHECK (btrim(name) <> '')
);

CREATE TABLE user_custom_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    training_date DATE NOT NULL,
    training_time TIME,
    name VARCHAR(150) NOT NULL,
    training_type_id UUID NOT NULL,
    notes TEXT,
    associated_race_id UUID,
    series_id UUID,
    series_interval_weeks INTEGER,
    series_until_date DATE,
    series_days_of_week SMALLINT[],
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_custom_trainings_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_custom_trainings_training_type
        FOREIGN KEY (training_type_id) REFERENCES user_custom_training_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_custom_trainings_associated_race
        FOREIGN KEY (associated_race_id) REFERENCES user_races(id) ON DELETE SET NULL,
    CONSTRAINT chk_user_custom_trainings_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT chk_user_custom_trainings_notes_not_blank CHECK (notes IS NULL OR btrim(notes) <> ''),
    CONSTRAINT chk_user_custom_trainings_series_interval_positive CHECK (
        series_interval_weeks IS NULL OR series_interval_weeks > 0
    ),
    CONSTRAINT chk_user_custom_trainings_series_until_valid CHECK (
        series_until_date IS NULL OR series_until_date >= training_date
    )
);

CREATE INDEX idx_user_custom_training_types_user_id ON user_custom_training_types (user_id);
CREATE INDEX idx_user_custom_trainings_user_id ON user_custom_trainings (user_id);
CREATE INDEX idx_user_custom_trainings_date ON user_custom_trainings (training_date);
CREATE INDEX idx_user_custom_trainings_race_id ON user_custom_trainings (associated_race_id);
CREATE INDEX idx_user_custom_trainings_series_id ON user_custom_trainings (series_id);

CREATE TRIGGER trg_user_custom_training_types_set_updated_at
BEFORE UPDATE ON user_custom_training_types
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_custom_trainings_set_updated_at
BEFORE UPDATE ON user_custom_trainings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
